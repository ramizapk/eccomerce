'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ProductDetailsModal from '@/components/products/ProductDetailsModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null); // For Modal

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        store_id: '',
        // category_id: '' // If backend supports it
    });

    // Data for Filters
    const [stores, setStores] = useState([]);

    // Pagination
    const [meta, setMeta] = useState({});

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.search), 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        loadParams();
    }, []);

    useEffect(() => {
        loadProducts(1);
    }, [debouncedSearch, filters.status, filters.store_id]);

    const loadParams = async () => {
        try {
            const storesRes = await api.getStores({ limit: 100 });
            if (storesRes.success) {
                // Handle pagination wrapper from Laravel Resource (data.data)
                const storesList = Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data.data || []);
                setStores(storesList);
            }
        } catch (e) {
            console.error('Error loading filter params', e);
        }
    };

    const loadProducts = async (page = 1) => {
        try {
            setLoading(true);

            // Clean Params
            const params = { page };
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.status !== 'all') params.status = filters.status;
            if (filters.store_id) params.store_id = filters.store_id;

            const response = await api.getProducts(params);

            if (response.success) {
                setProducts(response.data);
                // Correctly map meta for pagination logic
                // Backend sends: meta: { current_page, last_page, per_page, total }
                setMeta(response.meta);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('حدث خطأ أثناء تحميل المنتجات');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            setIsDeleting(true);
            await api.deleteProduct(productToDelete.id);
            toast.success('تم حذف المنتج بنجاح');
            setDeleteModalOpen(false);
            setProductToDelete(null);
            loadProducts(meta.current_page);
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error(error.message || 'حدث خطأ أثناء الحذف');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMainStatusToggle = async (product) => {
        const newStatus = product.main_status === 'available' ? 'unavailable' : 'available';
        try {
            setProducts(products.map(p => p.id === product.id ? { ...p, main_status: newStatus } : p));
            await api.updateProductMainStatus(product.id, newStatus);
            toast.success('تم تحديث حالة التوفر');
        } catch (error) {
            setProducts(products.map(p => p.id === product.id ? product : p));
            toast.error('حدث خطأ أثناء التحديث');
        }
    };

    const handleCuratedToggle = async (product) => {
        const isCurated = product.is_curated;
        // Optimistic update
        setProducts(products.map(p => p.id === product.id ? { ...p, is_curated: !isCurated } : p));

        try {
            if (isCurated) {
                await api.removeCuratedProduct(product.id);
                toast.success('تم إزالة المنتج من المختارات');
            } else {
                await api.addCuratedProduct(product.id);
                toast.success('تم إضافة المنتج للمختارات');
            }
        } catch (error) {
            // Revert
            setProducts(products.map(p => p.id === product.id ? product : p));
            toast.error('حدث خطأ أثناء التحديث');
            console.error(error);
        }
    };

    // Pagination Helper
    const renderPagination = () => {
        if (!meta.last_page || meta.last_page <= 1) return null;

        const pages = [];
        // Simple Logic: Show all pages if < 7, else show sparse
        // For MVP professional look, let's just show range around current
        const start = Math.max(1, meta.current_page - 2);
        const end = Math.min(meta.last_page, meta.current_page + 2);

        if (start > 1) pages.push(1);
        if (start > 2) pages.push('...');

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < meta.last_page - 1) pages.push('...');
        if (end < meta.last_page) pages.push(meta.last_page);

        return (
            <div className="flex items-center gap-1">
                {pages.map((p, idx) => (
                    <button
                        key={idx}
                        disabled={p === '...'}
                        onClick={() => typeof p === 'number' && loadProducts(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${p === meta.current_page
                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                            : p === '...'
                                ? 'text-gray-400 cursor-default'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                            }`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة المنتجات</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        {loading ? 'جاري التحميل...' : `إجمالي ${meta.total || 0} منتج`}
                    </p>
                </div>

                <Link
                    href="/dashboard/products/create"
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>إضافة منتج جديد</span>
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative w-full md:flex-1">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                        placeholder="بحث بالاسم، SKU..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                {/* Store Filter */}
                <div className="w-full md:w-48">
                    <div className="w-full md:w-48">
                        <select
                            value={filters.store_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, store_id: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm text-gray-900 cursor-pointer"
                        >
                            <option value="">جميع المتاجر</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Status Filter */}
                <div className="w-full md:w-48">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm text-gray-700 cursor-pointer"
                    >
                        <option value="all">جميع الحالات</option>
                        <option value="active">نشط (Active)</option>
                        <option value="draft">مسودة (Draft)</option>
                        <option value="archived">مؤرشف (Archived)</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-12 text-center">#</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المنتج</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المخزون</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المتجر / التصنيف</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">السعر</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left pl-8">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-gray-100 rounded-lg"></div><div className="h-4 bg-gray-100 rounded w-32"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <p className="font-medium">لا توجد منتجات</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product, index) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group cursor-default">
                                        <td className="px-6 py-4 text-sm text-gray-400 text-center font-mono">
                                            {String(product.id).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative border border-gray-200 flex-shrink-0 cursor-zoom-in"
                                                >
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-gray-300">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">SKU: {product.sku || '-'}</span>
                                                        {product.views > 0 && (
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                {product.views}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-sm font-bold font-mono ${product.stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {product.stock}
                                                </span>
                                                {/* Simple Stock Bar */}
                                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${product.stock < 5 ? 'bg-red-500' : product.stock < 20 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, (product.stock / 100) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{product.store?.name || '-'}</span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {product.categories?.slice(0, 2).map(c => (
                                                        <span key={c.id} className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">{c.name}</span>
                                                    ))}
                                                    {product.categories?.length > 2 && <span className="text-[10px] text-gray-400">+{product.categories.length - 2}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">
                                            {(() => {
                                                if (!product.variants || product.variants.length === 0) return '0';
                                                if (!product.has_variants) return <>{product.variants[0]?.price} <span className="text-xs text-gray-500 font-sans">ر.س</span></>;
                                                const prices = product.variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
                                                if (prices.length === 0) return '0';
                                                const min = Math.min(...prices);
                                                const max = Math.max(...prices);
                                                return min === max
                                                    ? <>{min} <span className="text-xs text-gray-500 font-sans">ر.س</span></>
                                                    : <>{min} - {max} <span className="text-xs text-gray-500 font-sans">ر.س</span></>;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex items-center w-fit gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${product.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    product.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-gray-100 text-gray-500 border-gray-200'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full ${product.status === 'active' ? 'bg-emerald-500' :
                                                        product.status === 'draft' ? 'bg-amber-500' :
                                                            'bg-gray-400'
                                                        }`}></span>
                                                    {product.status === 'active' ? 'نشط' : product.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMainStatusToggle(product); }}
                                                        className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${product.main_status === 'available' ? 'bg-primary-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.main_status === 'available' ? 'translate-x-[0px]' : '-translate-x-[12px]'}`}></span>
                                                    </button>
                                                    <span className="text-[10px] text-gray-500">{product.main_status === 'available' ? 'معروض' : 'مخفي'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCuratedToggle(product)}
                                                    className={`p-2 rounded-lg transition-all ${product.is_curated ? 'text-amber-400 hover:text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-gray-50'}`}
                                                    title={product.is_curated ? 'إزالة من المختارات' : 'إضافة للمختارات'}
                                                >
                                                    <svg className="w-5 h-5" fill={product.is_curated ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                    title="معاينة"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <Link
                                                    href={`/dashboard/products/${product.id}`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="تعديل"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="حذف"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">
                        صفحة {meta.current_page} من {meta.last_page}
                    </span>

                    {renderPagination()}

                    <div className="flex gap-2 text-xs font-bold text-gray-400">
                        <span>عرض {meta.per_page} عنصر</span>
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="حذف المنتج"
                message={`هل أنت متأكد من حذف المنتج "${productToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
                confirmText="نعم، احذف المنتج"
                cancelText="تراجع"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
