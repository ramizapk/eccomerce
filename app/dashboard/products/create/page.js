'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CategorySelector from '@/components/products/CategorySelector';

export default function CreateProductPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Data Sources
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [options, setOptions] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        store_id: '',
        brand_id: '',
        categories: [],
        status: 'draft',
        main_status: 'unavailable',

        images: [],
        imagePreviews: [],

        has_variants: false,
        price: '',
        stock: '',

        tier_prices: [],

        selected_options: [],
        variants: [],

        meta_title: '',
        meta_description: '',
        keywords: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [storesRes, brandsRes, catsRes, optionsRes] = await Promise.all([
                api.getStores({ limit: 100 }),
                api.getBrands(),
                api.getCategories(),
                api.getOptions()
            ]);

            if (storesRes.success) setStores(storesRes.data);
            if (brandsRes.success) setBrands(brandsRes.data);
            if (catsRes.success) setCategories(catsRes.data?.categories || catsRes.data || []);
            if (optionsRes.success) setOptions(optionsRes.data);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('فشل تحميل البيانات الأساسية');
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...files],
                imagePreviews: [...prev.imagePreviews, ...newPreviews]
            }));
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
        }));
    };

    const handleCategoryToggle = (id) => {
        setFormData(prev => {
            const exists = prev.categories.includes(id);
            return {
                ...prev,
                categories: exists
                    ? prev.categories.filter(cId => cId !== id)
                    : [...prev.categories, id]
            };
        });
    };

    // ======================
    // Tier Prices (Simple Product)
    // ======================
    const addSimpleTierPrice = () => {
        setFormData(prev => ({
            ...prev,
            tier_prices: [...prev.tier_prices, { min_qty: '', max_qty: '', price: '' }]
        }));
    };

    const removeSimpleTierPrice = (index) => {
        setFormData(prev => ({
            ...prev,
            tier_prices: prev.tier_prices.filter((_, i) => i !== index)
        }));
    };

    // ======================
    // Variant Helpers
    // ======================
    const generateSKU = (optionValues) => {
        const storeId = formData.store_id || '0';
        const valueParts = Object.values(optionValues || {}).filter(Boolean).join('-');
        const ts = Date.now().toString(36).slice(-4).toUpperCase();
        return `PRD-${storeId}-${valueParts || 'SMP'}-${ts}`;
    };

    const addVariant = () => {
        if (formData.selected_options.length === 0) {
            toast.error('الرجاء اختيار خيارات المنتج أولاً');
            return;
        }

        const newSku = generateSKU({});
        setFormData(prev => ({
            ...prev,
            variants: [
                ...prev.variants,
                { sku: newSku, price: '', stock: '', option_values: {}, tier_prices: [] }
            ]
        }));
    };

    const autoGenerateVariants = () => {
        if (formData.selected_options.length === 0) {
            toast.error('الرجاء اختيار خيارات المنتج أولاً');
            return;
        }

        const selectedOpts = formData.selected_options
            .map(id => options.find(o => o.id === id))
            .filter(Boolean);

        const hasValues = selectedOpts.every(opt => opt.values && opt.values.length > 0);
        if (!hasValues) {
            toast.error('بعض الخيارات المختارة ليس لها قيم');
            return;
        }

        const valueSets = selectedOpts.map(opt => opt.values.map(v => ({ optionId: opt.id, valueId: v.id })));

        const cartesian = (arrays) => {
            return arrays.reduce((acc, curr) => {
                const result = [];
                acc.forEach(a => { curr.forEach(b => { result.push([...a, b]); }); });
                return result;
            }, [[]]);
        };

        const combinations = cartesian(valueSets);
        const storeId = formData.store_id || '0';
        const newVariants = combinations.map((combo, idx) => {
            const optionValues = {};
            combo.forEach(item => { optionValues[item.optionId] = item.valueId; });
            const valueParts = combo.map(c => c.valueId).join('-');
            const ts = Date.now().toString(36).slice(-4).toUpperCase();
            return {
                sku: `PRD-${storeId}-${valueParts}-${ts}${idx}`,
                price: '',
                stock: '',
                option_values: optionValues,
                tier_prices: []
            };
        });

        setFormData(prev => ({ ...prev, variants: [...prev.variants, ...newVariants] }));
        toast.success(`تم توليد ${newVariants.length} متغير تلقائياً`);
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const getVariantDisplayName = (variant) => {
        if (!variant.option_values) return '';
        return Object.entries(variant.option_values).map(([optId, valId]) => {
            const opt = options.find(o => o.id === parseInt(optId));
            const val = opt?.values?.find(v => v.id === parseInt(valId));
            return val?.name || '';
        }).filter(Boolean).join(' / ');
    };

    // ======================
    // Validation Logic
    // ======================
    const validateForm = () => {
        const newErrors = {};

        if (!formData.has_variants) {
            const retailPrice = parseFloat(formData.price);
            if (retailPrice <= 0) newErrors.price = 'يجب أن يكون السعر أكبر من 0';

            formData.tier_prices.forEach((tier, idx) => {
                const tierPrice = parseFloat(tier.price);
                const minQty = parseInt(tier.min_qty);

                if (tierPrice >= retailPrice) {
                    newErrors[`tier_prices.${idx}.price`] = 'يجب أن يكون سعر الجملة أقل من سعر التجزئة';
                }
                if (minQty < 2) {
                    newErrors[`tier_prices.${idx}.min_qty`] = 'يجب أن تبدأ كمية الجملة من 2 أو أكثر';
                }
            });
        } else {
            if (formData.variants.length === 0) {
                toast.error('يجب إضافة نسخة واحدة على الأقل للمنتج');
                return false;
            }

            formData.variants.forEach((variant, vIdx) => {
                const variantPrice = parseFloat(variant.price);
                if (!variant.sku) newErrors[`variants.${vIdx}.sku`] = 'الرمز (SKU) مطلوب';
                if (!variantPrice || variantPrice <= 0) newErrors[`variants.${vIdx}.price`] = 'السعر مطلوب';

                (variant.tier_prices || []).forEach((tier, tIdx) => {
                    const tierPrice = parseFloat(tier.price);
                    const minQty = parseInt(tier.min_qty);

                    if (tierPrice >= variantPrice) {
                        newErrors[`variants.${vIdx}.tier_prices.${tIdx}.price`] = 'يجب أن يكون أقل من سعر النسخة';
                    }
                    if (minQty < 2) {
                        newErrors[`variants.${vIdx}.tier_prices.${tIdx}.min_qty`] = 'يجب أن يكون 2 أو أكثر';
                    }
                });
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ======================
    // Submit
    // ======================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            toast.error('يرجى تصحيح الأخطاء المنطقية في النموذج');
            return;
        }

        setSubmitting(true);

        const data = new FormData();
        data.append('name', formData.name);
        if (formData.description) data.append('description', formData.description);
        data.append('store_id', formData.store_id);
        if (formData.brand_id) data.append('brand_id', formData.brand_id);
        data.append('status', formData.status);
        data.append('main_status', formData.main_status);

        formData.categories.forEach(id => data.append('categories[]', id));
        formData.images.forEach(file => data.append('images[]', file));
        data.append('has_variants', formData.has_variants ? '1' : '0');

        if (formData.has_variants) {
            formData.selected_options.forEach(id => data.append('options[]', id));

            formData.variants.forEach((variant, index) => {
                data.append(`variants[${index}][sku]`, variant.sku);
                data.append(`variants[${index}][price]`, variant.price);
                data.append(`variants[${index}][stock]`, variant.stock);

                if (variant.option_values) {
                    Object.entries(variant.option_values).forEach(([optId, valId]) => {
                        data.append(`variants[${index}][option_values][${optId}]`, valId);
                    });
                }

                if (variant.tier_prices && variant.tier_prices.length > 0) {
                    variant.tier_prices.forEach((tp, tpIndex) => {
                        data.append(`variants[${index}][tier_prices][${tpIndex}][min_qty]`, tp.min_qty);
                        if (tp.max_qty) data.append(`variants[${index}][tier_prices][${tpIndex}][max_qty]`, tp.max_qty);
                        data.append(`variants[${index}][tier_prices][${tpIndex}][price]`, tp.price);
                    });
                }
            });
        } else {
            data.append('price', formData.price);
            data.append('stock', formData.stock);

            if (formData.tier_prices && formData.tier_prices.length > 0) {
                formData.tier_prices.forEach((tp, tpIndex) => {
                    data.append(`tier_prices[${tpIndex}][min_qty]`, tp.min_qty);
                    if (tp.max_qty) data.append(`tier_prices[${tpIndex}][max_qty]`, tp.max_qty);
                    data.append(`tier_prices[${tpIndex}][price]`, tp.price);
                });
            }
        }

        if (formData.meta_title) data.append('meta_title', formData.meta_title);
        if (formData.meta_description) data.append('meta_description', formData.meta_description);
        if (formData.keywords) data.append('keywords', formData.keywords);

        try {
            await api.createProduct(data);
            toast.success('تم إنشاء المنتج بنجاح');
            router.push('/dashboard/products');
        } catch (error) {
            console.error('Error creating product:', error);
            if (error.errors) {
                setErrors(error.errors);
                toast.error('يوجد أخطاء في البيانات المدخلة');

                // Scroll to first error if possible (optional enhancement)
            } else {
                toast.error(error.message || 'فشل إنشاء المنتج');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">إضافة منتج جديد</h1>
                    <p className="text-gray-500 mt-1">أدخل تفاصيل المنتج الجديد بعناية</p>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">إلغاء</button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black shadow-lg disabled:opacity-70 flex items-center gap-2"
                    >
                        {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        <span>حفظ المنتج</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Basic Info */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-4">المعلومات الأساسية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المنتج <span className="text-red-500">*</span></label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none ${errors.name ? 'border-red-500 ring-4 ring-red-500/10 bg-white' : ''}`} />
                                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name[0] || errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">المتجر <span className="text-red-500">*</span></label>
                                <select required value={formData.store_id} onChange={e => setFormData({ ...formData, store_id: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none appearance-none ${errors.store_id ? 'border-red-500 ring-4 ring-red-500/10 bg-white' : ''}`}>
                                    <option value="">اختر المتجر...</option>
                                    {stores.map(store => <option key={store.id} value={store.id}>{store.store_name}</option>)}
                                </select>
                                {errors.store_id && <p className="text-red-500 text-xs mt-1 font-bold">{errors.store_id[0] || errors.store_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">العلامة التجارية</label>
                                <select value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none appearance-none">
                                    <option value="">-- اختياري --</option>
                                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                                <textarea rows="4" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-4">صور المنتج</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                    {index === 0 && <div className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-[10px] font-bold text-center py-0.5">الرئيسية</div>}
                                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all">
                                <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageChange} />
                                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                <span className="text-xs font-bold text-gray-500">إضافة صور</span>
                            </label>
                        </div>
                    </div>

                    {/* Pricing & Variants */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-lg text-gray-900">السعر والخيارات</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-700">متعدد الخيارات؟</span>
                                <button type="button" onClick={() => setFormData({ ...formData, has_variants: !formData.has_variants, variants: [], tier_prices: [] })}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.has_variants ? 'bg-primary-600' : 'bg-gray-200'}`}>
                                    <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" style={{ transform: formData.has_variants ? 'translateX(0)' : 'translateX(-20px)' }}></span>
                                </button>
                            </div>
                        </div>

                        {!formData.has_variants ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">سعر التجزئة (ر.س) <span className="text-red-500">*</span></label>
                                        <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none ${errors.price ? 'border-red-500 ring-4 ring-red-500/10 bg-white' : ''}`} placeholder="0.00" />
                                        {errors.price && <p className="text-red-500 text-xs mt-1 font-bold">{errors.price[0] || errors.price}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">الكمية المتوفرة <span className="text-red-500">*</span></label>
                                        <input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none ${errors.stock ? 'border-red-500 ring-4 ring-red-500/10 bg-white' : ''}`} placeholder="0" />
                                        {errors.stock && <p className="text-red-500 text-xs mt-1 font-bold">{errors.stock[0] || errors.stock}</p>}
                                    </div>
                                </div>

                                {/* Tier Prices - Simple Product (INLINE, no sub-component) */}
                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700">أسعار الجملة</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">حدد أسعار مختلفة حسب الكمية المطلوبة</p>
                                        </div>
                                        <button type="button" onClick={addSimpleTierPrice}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all">
                                            + إضافة شريحة سعر
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.tier_prices.map((tier, tIdx) => (
                                            <div key={tIdx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">من (كمية)</label>
                                                    <input type="number" min="2" placeholder="2"
                                                        value={tier.min_qty}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const arr = [...prev.tier_prices];
                                                                arr[tIdx] = { ...arr[tIdx], min_qty: val };
                                                                return { ...prev, tier_prices: arr };
                                                            });
                                                        }}
                                                        className={`w-full px-3 py-1.5 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`tier_prices.${tIdx}.min_qty`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                    {errors[`tier_prices.${tIdx}.min_qty`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`tier_prices.${tIdx}.min_qty`][0] || errors[`tier_prices.${tIdx}.min_qty`]}</p>}
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">إلى (كمية)</label>
                                                    <input type="number" placeholder="فارغ = ∞"
                                                        value={tier.max_qty}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const arr = [...prev.tier_prices];
                                                                arr[tIdx] = { ...arr[tIdx], max_qty: val };
                                                                return { ...prev, tier_prices: arr };
                                                            });
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">السعر (ر.س)</label>
                                                    <input type="number" step="0.01" placeholder="0.00"
                                                        value={tier.price}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const arr = [...prev.tier_prices];
                                                                arr[tIdx] = { ...arr[tIdx], price: val };
                                                                return { ...prev, tier_prices: arr };
                                                            });
                                                        }}
                                                        className={`w-full px-3 py-1.5 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`tier_prices.${tIdx}.price`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                    {errors[`tier_prices.${tIdx}.price`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`tier_prices.${tIdx}.price`][0] || errors[`tier_prices.${tIdx}.price`]}</p>}
                                                </div>
                                                <button type="button" onClick={() => removeSimpleTierPrice(tIdx)} className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                        {formData.tier_prices.length === 0 && (
                                            <p className="text-xs text-gray-400 text-center py-3">لم يتم إضافة أسعار جملة بعد</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Option Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">خيارات المنتج المستخدمة</label>
                                    <div className="flex flex-wrap gap-2">
                                        {options.map(option => (
                                            <label key={option.id} className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-bold transition-all ${formData.selected_options.includes(option.id) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                                <input type="checkbox" className="hidden"
                                                    checked={formData.selected_options.includes(option.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(p => ({ ...p, selected_options: [...p.selected_options, option.id] }));
                                                        } else {
                                                            setFormData(p => ({ ...p, selected_options: p.selected_options.filter(id => id !== option.id) }));
                                                        }
                                                    }}
                                                />
                                                {option.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Variants */}
                                <div className="space-y-4">
                                    {formData.variants.map((variant, vIdx) => (
                                        <div key={vIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-gray-500">
                                                    نسخة #{vIdx + 1}
                                                    {getVariantDisplayName(variant) && <span className="text-primary-600 mr-2">({getVariantDisplayName(variant)})</span>}
                                                </span>
                                                <button type="button" onClick={() => removeVariant(vIdx)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>

                                            {/* Option Values Selection */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                {formData.selected_options.map(optId => {
                                                    const option = options.find(o => o.id === optId);
                                                    if (!option) return null;
                                                    return (
                                                        <div key={optId}>
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">{option.name}</label>
                                                            <select value={variant.option_values?.[optId] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setFormData(prev => {
                                                                        const arr = [...prev.variants];
                                                                        arr[vIdx] = { ...arr[vIdx], option_values: { ...arr[vIdx].option_values, [optId]: val } };
                                                                        return { ...prev, variants: arr };
                                                                    });
                                                                }}
                                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none" required>
                                                                <option value="">اختر القيمة</option>
                                                                {option.values?.map(val => <option key={val.id} value={val.id}>{val.name}</option>)}
                                                            </select>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* SKU, Price, Stock */}
                                            <div className="grid grid-cols-3 gap-4 mb-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">SKU (يُولّد تلقائياً)</label>
                                                    <input type="text" placeholder="SKU" required
                                                        value={variant.sku}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const arr = [...prev.variants];
                                                                arr[vIdx] = { ...arr[vIdx], sku: val };
                                                                return { ...prev, variants: arr };
                                                            });
                                                        }}
                                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`variants.${vIdx}.sku`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                    {errors[`variants.${vIdx}.sku`] && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors[`variants.${vIdx}.sku`][0] || errors[`variants.${vIdx}.sku`]}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">سعر التجزئة</label>
                                                    <input type="number" placeholder="السعر" required
                                                        value={variant.price}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const arr = [...prev.variants];
                                                                arr[vIdx] = { ...arr[vIdx], price: val };
                                                                return { ...prev, variants: arr };
                                                            });
                                                        }}
                                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`variants.${vIdx}.price`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                    {errors[`variants.${vIdx}.price`] && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors[`variants.${vIdx}.price`][0] || errors[`variants.${vIdx}.price`]}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">المخزون</label>
                                                    <input type="number" placeholder="الكمية" required
                                                        value={variant.stock}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData(prev => {
                                                                const arr = [...prev.variants];
                                                                arr[vIdx] = { ...arr[vIdx], stock: val };
                                                                return { ...prev, variants: arr };
                                                            });
                                                        }}
                                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`variants.${vIdx}.stock`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                    {errors[`variants.${vIdx}.stock`] && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors[`variants.${vIdx}.stock`][0] || errors[`variants.${vIdx}.stock`]}</p>}
                                                </div>
                                            </div>

                                            {/* Tier Prices for this variant (INLINE) */}
                                            <div className="border-t border-gray-200 pt-3 mt-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-gray-500">أسعار الجملة</span>
                                                    <button type="button"
                                                        onClick={() => {
                                                            setFormData(prev => {
                                                                const arr = [...prev.variants];
                                                                const tps = arr[vIdx].tier_prices || [];
                                                                arr[vIdx] = { ...arr[vIdx], tier_prices: [...tps, { min_qty: '', max_qty: '', price: '' }] };
                                                                return { ...prev, variants: arr };
                                                            });
                                                        }}
                                                        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-white hover:bg-primary-50 px-2 py-1 rounded border border-primary-200 transition-all">
                                                        + شريحة سعر
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(variant.tier_prices || []).map((tp, tpIdx) => (
                                                        <div key={tpIdx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-1">من (كمية)</label>
                                                                <input type="number" min="2" placeholder="2"
                                                                    value={tp.min_qty}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setFormData(prev => {
                                                                            const arr = [...prev.variants];
                                                                            const tps = [...(arr[vIdx].tier_prices || [])];
                                                                            tps[tpIdx] = { ...tps[tpIdx], min_qty: val };
                                                                            arr[vIdx] = { ...arr[vIdx], tier_prices: tps };
                                                                            return { ...prev, variants: arr };
                                                                        });
                                                                    }}
                                                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`variants.${vIdx}.tier_prices.${tpIdx}.min_qty`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                                {errors[`variants.${vIdx}.tier_prices.${tpIdx}.min_qty`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`variants.${vIdx}.tier_prices.${tpIdx}.min_qty`][0] || errors[`variants.${vIdx}.tier_prices.${tpIdx}.min_qty`]}</p>}
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-1">إلى (كمية)</label>
                                                                <input type="number" placeholder="فارغ = ∞"
                                                                    value={tp.max_qty}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setFormData(prev => {
                                                                            const arr = [...prev.variants];
                                                                            const tps = [...(arr[vIdx].tier_prices || [])];
                                                                            tps[tpIdx] = { ...tps[tpIdx], max_qty: val };
                                                                            arr[vIdx] = { ...arr[vIdx], tier_prices: tps };
                                                                            return { ...prev, variants: arr };
                                                                        });
                                                                    }}
                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-gray-400 mb-1">السعر (ر.س)</label>
                                                                <input type="number" step="0.01" placeholder="0.00"
                                                                    value={tp.price}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setFormData(prev => {
                                                                            const arr = [...prev.variants];
                                                                            const tps = [...(arr[vIdx].tier_prices || [])];
                                                                            tps[tpIdx] = { ...tps[tpIdx], price: val };
                                                                            arr[vIdx] = { ...arr[vIdx], tier_prices: tps };
                                                                            return { ...prev, variants: arr };
                                                                        });
                                                                    }}
                                                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm focus:border-primary-500 outline-none ${errors[`variants.${vIdx}.tier_prices.${tpIdx}.price`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                                                {errors[`variants.${vIdx}.tier_prices.${tpIdx}.price`] && <p className="text-[10px] text-red-500 mt-0.5 font-bold">{errors[`variants.${vIdx}.tier_prices.${tpIdx}.price`][0] || errors[`variants.${vIdx}.tier_prices.${tpIdx}.price`]}</p>}
                                                            </div>
                                                            <button type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => {
                                                                        const arr = [...prev.variants];
                                                                        const tps = (arr[vIdx].tier_prices || []).filter((_, i) => i !== tpIdx);
                                                                        arr[vIdx] = { ...arr[vIdx], tier_prices: tps };
                                                                        return { ...prev, variants: arr };
                                                                    });
                                                                }}
                                                                className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-3">
                                        <button type="button" onClick={addVariant}
                                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl border border-dashed border-gray-300 transition-all">
                                            + إضافة نسخة يدوياً
                                        </button>
                                        <button type="button" onClick={autoGenerateVariants}
                                            className="flex-1 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-xl border border-dashed border-primary-300 transition-all">
                                            ⚡ توليد تلقائي من الخيارات
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Status */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">حالة النشر</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">الحالة العامة</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 border-transparent focus:bg-white text-sm font-bold">
                                <option value="draft">مسودة (Draft)</option>
                                <option value="active">نشط (Active)</option>
                                <option value="archived">مؤرشف (Archived)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">التوفر في العرض</label>
                            <select value={formData.main_status} onChange={e => setFormData({ ...formData, main_status: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 border-transparent focus:bg-white text-sm font-bold">
                                <option value="available">متاح (Available)</option>
                                <option value="unavailable">غير متاح (Unavailable)</option>
                            </select>
                        </div>
                    </div>


                    {/* Categories */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-gray-900">التصنيفات</h3>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                {formData.categories.length} مختارة
                            </span>
                        </div>
                        <CategorySelector
                            categories={categories}
                            selectedCategories={formData.categories}
                            onChange={handleCategoryToggle}
                        />
                    </div>

                    {/* SEO */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">تحسين محركات البحث (SEO)</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">عنوان الصفحة (Meta Title)</label>
                            <input type="text" value={formData.meta_title} onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 border-transparent focus:bg-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">الوصف (Meta Description)</label>
                            <textarea rows="3" value={formData.meta_description} onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 border-transparent focus:bg-white text-sm resize-none"></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">الكلمات المفتاحية (Keywords)</label>
                            <input type="text" value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 border-transparent focus:bg-white text-sm" placeholder="كلمة1, كلمة2, كلمة3" />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
