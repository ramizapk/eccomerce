'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // View State
    const [selectedParent, setSelectedParent] = useState(null); // Parent category for the sub-modal
    const [showSubModal, setShowSubModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        status: 'active',
        parent_id: '',
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await api.getCategories({ parents_only: false });
            if (response.success) {
                const fetchedCategories = response.data?.categories || response.data || [];
                setCategories(fetchedCategories);

                // Update selected parent if change occurs
                if (selectedParent) {
                    const freshParent = fetchedCategories.find(c => c.id === selectedParent.id);
                    if (freshParent) setSelectedParent(freshParent);
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('حدث خطأ أثناء تحميل الفئات');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic (Main Table - Only Top Level)
    const filteredCategories = useMemo(() => {
        return categories.filter(category => {
            const isTopLevel = category.parent_id === null;
            const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.slug.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || category.status === statusFilter;

            return isTopLevel && matchesSearch && matchesStatus;
        });
    }, [categories, searchQuery, statusFilter]);

    // Subcategories for the Modal
    const subCategories = useMemo(() => {
        if (!selectedParent) return [];

        // Try to find from flat list (if the API ever returns them as siblings)
        const fromFlat = categories.filter(c => c.parent_id === selectedParent.id);

        // Use the nested children from the API response (most likely case based on your JSON)
        return fromFlat.length > 0 ? fromFlat : (selectedParent.children || []);
    }, [categories, selectedParent]);

    // Top Level Categories for Parent Selection
    const topLevelCategories = useMemo(() => {
        return categories.filter(c => c.parent_id === null);
    }, [categories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            setFormErrors({});
            const data = new FormData();
            data.append('name', formData.name);
            data.append('slug', formData.slug);
            data.append('status', formData.status);
            if (formData.parent_id) {
                data.append('parent_id', formData.parent_id);
            }
            if (formData.image instanceof File) {
                data.append('image', formData.image);
            }

            if (editingCategory) {
                await api.updateCategory(editingCategory.id, data);
                toast.success('تم تحديث الفئة بنجاح');
            } else {
                await api.createCategory(data);
                toast.success('تم إضافة الفئة بنجاح');
            }

            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', slug: '', status: 'active', parent_id: '', image: null });
            setImagePreview(null);
            setFormErrors({});
            loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
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

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            status: category.status,
            parent_id: category.parent_id || '',
            image: null,
        });
        setImagePreview(category.image || null);
        setFormErrors({});
        setShowModal(true);
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        setSubmitting(true);
        try {
            await api.deleteCategory(categoryToDelete.id);
            toast.success('تم حذف الفئة بنجاح');
            setShowDeleteModal(false);
            setCategoryToDelete(null);
            loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(error.message || 'حدث خطأ أثناء الحذف');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة الفئات</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">تتبع وإدارة جميع فئات المتجر</p>
                </div>

                <div className="flex gap-2">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase">الكل</span>
                        <span className="text-lg font-black text-gray-900">{categories.length}</span>
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-gray-500 uppercase">نشط</span>
                        <span className="text-lg font-black text-gray-900">{categories.filter(c => c.status === 'active').length}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col">

                {/* Toolbar */}
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="flex flex-1 w-full md:w-auto gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                                placeholder="بحث عن فئة..."
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
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setFormData({ name: '', slug: '', status: 'active', parent_id: '', image: null });
                            setImagePreview(null);
                            setFormErrors({});
                            setShowModal(true);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>إضافة جديد</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-16 text-center">
                                    #
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    اسم الفئة
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    الفئات الفرعية
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    الحالة
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left pl-8">
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                // Loading Skeleton Rows
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg"></div><div className="h-4 bg-gray-100 rounded w-32"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="font-medium">لا توجد فئات مطابقة للبحث</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category, index) => (
                                    <tr
                                        key={category.id}
                                        className="hover:bg-gray-50/80 transition-colors group cursor-default"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-400 text-center font-mono">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {category.image ? (
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                                                        <img src={category.image} alt={category.name} className="w-full h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${index % 2 === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                                                        {category.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{category.name}</p>
                                                    {category.parent_id && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2">فرعي</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                                                {category.slug}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedParent(category);
                                                    setShowSubModal(true);
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-bold text-xs transition-all border border-indigo-100/50 shadow-sm"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                <span>{category.children_count || 0} فئة فرعية</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${category.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${category.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                {category.status === 'active' ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="تعديل"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(category)}
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
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <span>عرض {filteredCategories.length} نتيجة</span>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">السابق</button>
                        <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">التالي</button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 transition-all">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-primary-500 to-indigo-600"></div>

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">
                                    {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">قم بملء البيانات التالية للحفظ</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-indigo-500 transition-colors">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Image preview" className="w-full h-full object-contain p-2" />
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
                                                    setFormData({ ...formData, image: file });
                                                    setImagePreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <span className="text-xs font-bold text-gray-400">صورة الفئة</span>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">اسم الفئة</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 transition-all outline-none font-medium text-right ${formErrors.name ? 'border-red-500 bg-red-50 focus:bg-white focus:border-red-600' : 'border-transparent focus:bg-white focus:border-primary-500'
                                        }`}
                                    placeholder="مثال: إلكترونيات"
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
                                <label className="block text-sm font-bold text-gray-700 mb-2">Slug (الرابط)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 transition-all outline-none font-mono text-sm text-left ${formErrors.slug ? 'border-red-500 bg-red-50 focus:bg-white focus:border-red-600' : 'border-transparent focus:bg-white focus:border-primary-500'
                                        }`}
                                    placeholder="electronics"
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

                            {!editingCategory || editingCategory.parent_id !== null || editingCategory.children_count === 0 ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الفئة الأب (إن وجد)</label>
                                    <div className="relative">
                                        <select
                                            value={formData.parent_id}
                                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-medium appearance-none"
                                            disabled={submitting}
                                        >
                                            <option value="">-- فئة رئيسية --</option>
                                            {topLevelCategories.map(cat => (
                                                <option key={cat.id} value={cat.id} disabled={editingCategory?.id === cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[10px] text-gray-400">تدعم اللوحة مستويين فقط من التصنيفات</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 font-bold">هذه فئة رئيسية تحتوي على فئات فرعية، لا يمكن جعلها فرعية حالياً.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'active' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={formData.status === 'active'}
                                            onChange={() => setFormData({ ...formData, status: 'active' })}
                                            className="hidden"
                                        />
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="font-bold text-sm">نشط</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'inactive' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={formData.status === 'inactive'}
                                            onChange={() => setFormData({ ...formData, status: 'inactive' })}
                                            className="hidden"
                                        />
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        <span className="font-bold text-sm">غير نشط</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                    disabled={submitting}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {editingCategory ? 'حفظ التغييرات' : 'إضافة الفئة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subcategories Modal */}
            {showSubModal && selectedParent && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-all">
                    <div className="bg-white/95 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] max-w-2xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300 border border-white">

                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                        فروع: {selectedParent.name}
                                    </h2>
                                    <p className="text-gray-500 font-medium text-sm">إدارة الأقسام الفرعية التابعة لهذا القسم</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSubModal(false)}
                                className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 group"
                            >
                                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                            {subCategories.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-bold">لا توجد فئات فرعية مضافة بعد</p>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(null);
                                            setFormData({ name: '', slug: '', status: 'active', parent_id: selectedParent.id, image: null });
                                            setImagePreview(null);
                                            setShowModal(true);
                                        }}
                                        className="mt-4 text-indigo-600 font-black text-sm hover:underline"
                                    >
                                        إضافة أول فئة فرعية الآن +
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subCategories.map((sub, idx) => (
                                        <div
                                            key={sub.id}
                                            className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                {sub.image ? (
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                                                        <img src={sub.image} alt={sub.name} className="w-full h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                        {String(idx + 1).padStart(2, '0')}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.name}</h4>
                                                    <p className="text-[10px] font-mono text-gray-400">{sub.slug}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${sub.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-gray-50 text-gray-400 border-gray-100'
                                                    }`}>
                                                    {sub.status === 'active' ? 'نشط' : 'معطل'}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <button
                                                        onClick={() => handleEdit(sub)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(sub)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 pt-4 border-t border-gray-100 bg-gray-50/50 rounded-b-[2.5rem] flex gap-3">
                            <button
                                onClick={() => {
                                    setEditingCategory(null);
                                    setFormData({ name: '', slug: '', status: 'active', parent_id: selectedParent.id, image: null });
                                    setImagePreview(null);
                                    setShowModal(true);
                                }}
                                className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-gray-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span>إضافة فئة فرعية جديدة</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="حذف الفئة"
                message={`هل أنت متأكد من حذف الفئة "${categoryToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
                confirmText="نعم، احذف الفئة"
                cancelText="تراجع"
                variant="danger"
                loading={submitting}
            />
        </div>
    );
}
