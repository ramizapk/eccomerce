'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        status: 'active',
        logo: null,
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            setLoading(true);
            const response = await api.getBrands();
            if (response.success) {
                setBrands(response.data || []);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
            toast.error('حدث خطأ أثناء تحميل البراندات');
        } finally {
            setLoading(false);
        }
    };

    const filteredBrands = useMemo(() => {
        return brands.filter(brand => {
            const matchesSearch = (brand.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (brand.slug || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [brands, searchQuery, statusFilter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            setFormErrors({});
            const data = new FormData();
            data.append('name', formData.name);
            data.append('slug', formData.slug);
            data.append('description', formData.description);
            data.append('status', formData.status);
            if (formData.logo instanceof File) {
                data.append('logo', formData.logo);
            }

            if (editingBrand) {
                await api.updateBrand(editingBrand.id, data);
                toast.success('تم تحديث البراند بنجاح');
            } else {
                await api.createBrand(data);
                toast.success('تم إضافة البراند بنجاح');
            }

            setShowModal(false);
            setEditingBrand(null);
            setFormData({ name: '', slug: '', description: '', status: 'active', logo: null });
            setLogoPreview(null);
            setFormErrors({});
            loadBrands();
        } catch (error) {
            console.error('Error saving brand:', error);
            if (error.errors) {
                setFormErrors(error.errors);
                toast.error('يرجى التحقق من البيانات المدخلة');
            } else {
                toast.error(error.message || 'حدث خطأ أثناء الحفظ');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            slug: brand.slug,
            description: brand.description || '',
            status: brand.status || 'active',
            logo: null,
        });
        setLogoPreview(brand.logo);
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = (brand) => {
        setBrandToDelete(brand);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!brandToDelete) return;

        try {
            setIsDeleting(true);
            await api.deleteBrand(brandToDelete.id);
            toast.success('تم حذف البراند بنجاح');
            setDeleteModalOpen(false);
            setBrandToDelete(null);
            loadBrands();
        } catch (error) {
            console.error('Error deleting brand:', error);
            toast.error(error.message || 'حدث خطأ أثناء الحذف');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة البراندات</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1"> التحكم بالعلامات التجارية للمنتجات</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase">الكل</span>
                        <span className="text-lg font-black text-gray-900">{brands.length}</span>
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-green-600 uppercase">نشط</span>
                        <span className="text-lg font-black text-gray-900">{brands.filter(b => b.status === 'active').length}</span>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="flex flex-1 w-full md:w-auto gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                                placeholder="بحث في البراندات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm shadow-sm cursor-pointer font-medium text-gray-700"
                            >
                                <option value="all">جميع الحالات</option>
                                <option value="active">نشط فقط</option>
                                <option value="inactive">غير نشط</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                    {/* Add Button */}
                    <button
                        onClick={() => {
                            setEditingBrand(null);
                            setFormData({ name: '', slug: '', description: '', status: 'active', logo: null });
                            setLogoPreview(null);
                            setFormErrors({});
                            setShowModal(true);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        <span>إضافة براند</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-16 text-center">#</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">اسم البراند</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الرابط (Slug)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الوصف</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left pl-8">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg"></div><div className="h-4 bg-gray-100 rounded w-32"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredBrands.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            <p className="font-medium">لا توجد براندات بهذا الاسم</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBrands.map((brand, index) => (
                                    <tr key={brand.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                                        <td className="px-6 py-4 text-sm text-gray-400 text-center font-mono">{String(index + 1).padStart(2, '0')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {brand.logo ? (
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                                                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${index % 2 === 0 ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                                        }`}>
                                                        {brand.name ? brand.name.charAt(0) : '?'}
                                                    </div>
                                                )}
                                                <p className="text-sm font-bold text-gray-900">{brand.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">{brand.slug}</code>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{brand.description || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${brand.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${brand.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                {brand.status === 'active' ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(brand)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="تعديل">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(brand)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <span>عرض {filteredBrands.length} نتيجة</span>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{editingBrand ? 'تعديل البراند' : 'إضافة براند جديد'}</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-indigo-500 transition-colors">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-lg shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setFormData({ ...formData, logo: file });
                                                    setLogoPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <span className="text-xs font-bold text-gray-400">لوجو البراند</span>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">اسم البراند</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 transition-all outline-none font-medium ${formErrors.name ? 'border-red-500 bg-red-50 focus:bg-white focus:border-red-600' : 'border-transparent focus:bg-white focus:border-indigo-500'
                                        }`}
                                    required
                                    disabled={submitting}
                                />
                                {formErrors.name && (
                                    <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {formErrors.name[0]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 transition-all outline-none font-mono text-sm ${formErrors.slug ? 'border-red-500 bg-red-50 focus:bg-white focus:border-red-600' : 'border-transparent focus:bg-white focus:border-indigo-500'
                                        }`}
                                    required
                                    disabled={submitting}
                                />
                                {formErrors.slug && (
                                    <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {formErrors.slug[0]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-sm" rows={3} disabled={submitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'active' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={() => setFormData({ ...formData, status: 'active' })} className="hidden" />
                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="font-bold text-sm">نشط</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'inactive' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={() => setFormData({ ...formData, status: 'inactive' })} className="hidden" />
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span><span className="font-bold text-sm">غير نشط</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors" disabled={submitting}>إلغاء</button>
                                <button type="submit" disabled={submitting} className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">{submitting ? 'جاري الحفظ...' : (editingBrand ? 'حفظ التغييرات' : 'إضافة البراند')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="حذف البراند"
                message={`هل أنت متأكد من حذف البراند "${brandToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
                confirmText="نعم، احذف البراند"
                cancelText="تراجع"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
