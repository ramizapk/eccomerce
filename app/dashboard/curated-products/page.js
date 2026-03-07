'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ProductDetailsModal from '@/components/products/ProductDetailsModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function CuratedProductsPage() {
    const [curatedProducts, setCuratedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Modal Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadCuratedProducts();
    }, []);

    const loadCuratedProducts = async () => {
        try {
            setLoading(true);
            const response = await api.getCuratedProducts();
            if (response.success) {
                setCuratedProducts(response.data);
            }
        } catch (error) {
            console.error('Error loading curated products:', error);
            toast.error('حدث خطأ أثناء تحميل المنتجات المختارة');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await api.getProducts({ search: term });
            if (response.success) {
                setSearchResults(response.data);
            }
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddProduct = async (product) => {
        try {
            await api.addCuratedProduct(product.id);
            toast.success('تم إضافة المنتج للقائمة المختارة');
            setShowModal(false);
            setSearchTerm('');
            setSearchResults([]);
            loadCuratedProducts();
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error('حدث خطأ أثناء إضافة المنتج');
        }
    };

    const confirmRemoveProduct = (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: 'إزالة المنتج من القائمة',
            message: `هل أنت متأكد من رغبتك في إزالة المنتج "${name}" من قائمة المختارات؟ هذا الإجراء لن يحذف المنتج من المتجر.`,
            onConfirm: () => handleRemoveProduct(id)
        });
    };

    const handleRemoveProduct = async (id) => {
        // Close modal first
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        // Optimistic UI update
        const previousProducts = [...curatedProducts];
        setCuratedProducts(curatedProducts.filter(p => p.id !== id));

        try {
            await api.removeCuratedProduct(id);
            toast.success('تم إزالة المنتج من القائمة');
        } catch (error) {
            console.error('Error removing product:', error);
            toast.error('حدث خطأ أثناء الإزالة');
            setCuratedProducts(previousProducts); // Revert
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">مختاراتنا (Curated)</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">إدارة قائمة "اخترنا لك بعناية"</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>إضافة منتج للقائمة</span>
                </button>
            </div>

            {/* List */}
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
                            ) : curatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <p className="font-medium">القائمة فارغة</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                curatedProducts.map((product, index) => (
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
                                            {product.variants?.[0]?.price} <span className="text-xs text-gray-500 font-sans">ر.س</span>
                                        </td>
                                        <td className="px-6 py-4">
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
                                        </td>
                                        <td className="px-6 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                <button
                                                    onClick={() => confirmRemoveProduct(product.id, product.name)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="إزالة من القائمة"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            </div>

            {/* Quick View Modal */}
            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="إزالة"
                cancelText="تراجع"
            />

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 animate-fade-in relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black text-gray-900 mb-6">إضافة منتج للمختارات</h2>

                        <div className="mb-6">
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-medium text-right"
                                placeholder="ابحث عن اسم المنتج..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {searching ? (
                                <div className="text-center py-8 text-gray-400">جاري البحث...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer group" onClick={() => handleAddProduct(product)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                                {product.images?.[0] && <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.store?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-primary-600 opacity-0 group-hover:opacity-100 font-bold text-xs bg-primary-50 px-2 py-1 rounded">إضافة +</div>
                                    </div>
                                ))
                            ) : searchTerm.length > 1 ? (
                                <div className="text-center py-8 text-gray-400">لا توجد نتائج</div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">ابدأ الكتابة للبحث عن منتجات</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
