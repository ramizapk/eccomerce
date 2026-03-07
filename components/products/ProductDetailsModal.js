'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ProductDetailsModal({ product, onClose }) {
    const [fullProduct, setFullProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product?.id) {
            fetchFullProduct(product.id);
        } else {
            setFullProduct(null);
        }
    }, [product?.id]);

    const fetchFullProduct = async (id) => {
        setLoading(true);
        try {
            const res = await api.getProduct(id);
            if (res.success) {
                setFullProduct(res.data);
            }
        } catch (e) {
            console.error('Error fetching product:', e);
            setFullProduct(product); // fallback to list data
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    const p = fullProduct || product;

    // Get price display
    const getPriceDisplay = () => {
        if (!p.variants || p.variants.length === 0) return '0 ر.س';
        if (!p.has_variants) return `${p.variants[0]?.price} ر.س`;

        const prices = p.variants.map(v => parseFloat(v.price)).filter(pr => !isNaN(pr));
        if (prices.length === 0) return '0 ر.س';
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `${min} ر.س` : `${min} - ${max} ر.س`;
    };

    // Build variant display name from option values
    const getVariantName = (variant) => {
        const values = variant.values || variant.option_values || [];
        if (Array.isArray(values) && values.length > 0) {
            return values.map(v => v.name || v.value).filter(Boolean).join(' / ');
        }
        return variant.sku;
    };

    const mainStatusLabel = p.main_status === 'available' ? 'متاح' : 'غير متاح';
    const mainStatusColor = p.main_status === 'available' ? 'bg-emerald-500' : 'bg-amber-500';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-fade-in" onClick={e => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-all z-10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* Images Section */}
                        <div className="bg-gray-50 p-6 md:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-gray-100">
                            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white mb-4 shadow-sm border border-gray-100 relative">
                                {p.images?.[0] ? (
                                    <img src={p.images[0].url} alt={p.name} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-300">
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-1">
                                    <span className="px-3 py-1 bg-black/80 backdrop-blur text-white text-xs font-bold rounded-full">
                                        {p.status === 'active' ? 'نشط' : p.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                                    </span>
                                    <span className={`px-3 py-1 ${mainStatusColor} text-white text-xs font-bold rounded-full`}>
                                        {mainStatusLabel}
                                    </span>
                                </div>
                            </div>

                            {p.images?.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
                                    {p.images.map(img => (
                                        <div key={img.id} className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-white">
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-6 md:p-8 space-y-5">
                            <div>
                                <p className="text-xs font-bold text-primary-600 mb-2">{p.store?.name} {p.brand && `• ${p.brand.name}`}</p>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{p.name}</h2>
                                <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-500">
                                    {p.categories?.map(c => <span key={c.id} className="bg-gray-100 px-2 py-1 rounded">{c.name}</span>)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-1">السعر</label>
                                    <p className="text-xl font-black text-gray-900 font-mono">{getPriceDisplay()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-1">المخزون الكلي</label>
                                    <p className={`text-xl font-black font-mono ${p.stock > 10 ? 'text-emerald-600' : 'text-amber-500'}`}>{p.stock}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-1">SKU</label>
                                    <p className="text-sm font-medium text-gray-700 font-mono">{p.sku}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-1">المشاهدات</label>
                                    <p className="text-sm font-medium text-gray-700 font-mono">{p.views}</p>
                                </div>
                            </div>

                            {p.description && (
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-2">الوصف</label>
                                    <p className="text-sm text-gray-600 leading-relaxed max-h-[100px] overflow-y-auto">{p.description}</p>
                                </div>
                            )}

                            {/* Options used */}
                            {p.options?.length > 0 && (
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-2">خيارات المنتج</label>
                                    <div className="flex flex-wrap gap-2">
                                        {p.options.map(opt => (
                                            <span key={opt.id} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded">{opt.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Variants Table */}
                            {p.has_variants && p.variants?.length > 0 && (
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-2">النسخ المتوفرة ({p.variants.length})</label>
                                    <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl">
                                        <table className="w-full text-xs text-right">
                                            <thead className="bg-gray-50 text-gray-400 font-bold sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2">النسخة</th>
                                                    <th className="px-3 py-2">SKU</th>
                                                    <th className="px-3 py-2">السعر</th>
                                                    <th className="px-3 py-2">المخزون</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {p.variants.map(v => (
                                                    <tr key={v.id} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 font-medium text-gray-900">
                                                            {getVariantName(v)}
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-gray-500">{v.sku}</td>
                                                        <td className="px-3 py-2 font-mono">{v.price} ر.س</td>
                                                        <td className="px-3 py-2 font-mono">
                                                            <span className={v.stock < 5 ? 'text-red-500' : ''}>{v.stock}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tier Prices */}
                            {p.variants?.some(v => v.tier_prices?.length > 0) && (
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-2">أسعار الجملة</label>
                                    <div className="space-y-3 max-h-[180px] overflow-y-auto">
                                        {p.variants.filter(v => v.tier_prices?.length > 0).map(v => (
                                            <div key={v.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                                <p className="text-xs font-bold text-amber-700 mb-1.5">
                                                    {p.has_variants ? getVariantName(v) : 'المنتج'}
                                                </p>
                                                <div className="space-y-1">
                                                    {v.tier_prices.map((tp, i) => (
                                                        <div key={i} className="flex justify-between text-[11px] text-amber-600">
                                                            <span>{tp.min_qty} - {tp.max_qty || '∞'} قطعة</span>
                                                            <span className="font-bold font-mono">{tp.price} ر.س</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SEO Info */}
                            {(p.seo?.meta_title || p.seo?.meta_description || p.seo?.keywords) && (
                                <div className="border-t border-gray-100 pt-4">
                                    <label className="text-xs text-gray-400 font-bold block mb-2">SEO</label>
                                    <div className="space-y-1 text-xs text-gray-500">
                                        {p.seo?.meta_title && <p><span className="font-bold text-gray-600">العنوان:</span> {p.seo.meta_title}</p>}
                                        {p.seo?.meta_description && <p><span className="font-bold text-gray-600">الوصف:</span> {p.seo.meta_description}</p>}
                                        {p.seo?.keywords && <p><span className="font-bold text-gray-600">كلمات مفتاحية:</span> {p.seo.keywords}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Created At */}
                            <div className="text-[10px] text-gray-400 pt-2">
                                تاريخ الإنشاء: {new Date(p.created_at).toLocaleDateString('ar-SA')}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
