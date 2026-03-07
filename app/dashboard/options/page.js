'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function OptionsPage() {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOption, setEditingOption] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [optionToDelete, setOptionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        type: 'select',
        status: 'active',
        values: [],
    });
    const [valueInput, setValueInput] = useState({ name: '', value: '' });

    useEffect(() => {
        loadOptions();
    }, []);

    const loadOptions = async () => {
        try {
            setLoading(true);
            const response = await api.getOptions();
            setOptions(response.data || []);
        } catch (error) {
            console.error('Error loading options:', error);
            toast.error('حدث خطأ أثناء تحميل الخيارات');
        } finally {
            setLoading(false);
        }
    };

    const filteredOptions = useMemo(() => {
        return options.filter(option => {
            const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || option.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [options, searchQuery, typeFilter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingOption) {
                await api.updateOption(editingOption.id, formData);
                toast.success('تم تحديث الخيار بنجاح');
            } else {
                await api.createOption(formData);
                toast.success('تم إضافة الخيار بنجاح');
            }

            setShowModal(false);
            setEditingOption(null);
            setFormData({ name: '', type: 'select', status: 'active', values: [] });
            loadOptions();
        } catch (error) {
            console.error('Error saving option:', error);
            toast.error(error.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (option) => {
        setEditingOption(option);
        setFormData({
            name: option.name,
            type: option.type,
            status: option.status || 'active',
            values: option.values || [],
        });
        showModalWithAnimation();
    };

    const showModalWithAnimation = () => {
        setShowModal(true);
    };

    const handleDelete = (option) => {
        setOptionToDelete(option);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!optionToDelete) return;

        try {
            setIsDeleting(true);
            await api.deleteOption(optionToDelete.id);
            toast.success('تم حذف الخيار بنجاح');
            setDeleteModalOpen(false);
            setOptionToDelete(null);
            loadOptions();
        } catch (error) {
            console.error('Error deleting option:', error);
            toast.error(error.message || 'حدث خطأ أثناء الحذف');
        } finally {
            setIsDeleting(false);
        }
    };

    const addValue = () => {
        if (!valueInput.name.trim()) {
            toast.error('الرجاء إدخال اسم القيمة');
            return;
        }

        setFormData({
            ...formData,
            values: [...formData.values, { ...valueInput }],
        });
        setValueInput({ name: '', value: '' });
    };

    const removeValue = (index) => {
        setFormData({
            ...formData,
            values: formData.values.filter((_, i) => i !== index),
        });
    };

    const getTypeLabel = (type) => {
        const types = {
            select: 'قائمة منسدلة',
            radio: 'خيارات راديو',
            color: 'ألوان',
            text: 'نص حر'
        };
        return types[type] || type;
    };

    const getTypeColor = (type) => {
        const colors = {
            select: 'bg-blue-50 text-blue-700 border-blue-100',
            radio: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            color: 'bg-pink-50 text-pink-700 border-pink-100',
            text: 'bg-gray-50 text-gray-700 border-gray-100'
        };
        return colors[type] || 'bg-gray-50 text-gray-600';
    };

    return (
        <div className="space-y-8 font-cairo">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة الخيارات</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">تخصيص خيارات المنتجات والمواصفات (مثل الحجم، اللون)</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase">إجمالي الخيارات</span>
                        <span className="text-lg font-black text-gray-900">{options.length}</span>
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
                                placeholder="بحث عن خيار..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Filter */}
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm shadow-sm cursor-pointer font-medium text-gray-700"
                            >
                                <option value="all">جميع الأنواع</option>
                                <option value="select">قائمة منسدلة</option>
                                <option value="radio">راديو</option>
                                <option value="color">ألوان</option>
                                <option value="text">نص</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                    {/* Add Button */}
                    <button
                        onClick={() => {
                            setEditingOption(null);
                            setFormData({ name: '', type: 'select', status: 'active', values: [] });
                            setValueInput({ name: '', value: '' });
                            showModalWithAnimation();
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        <span>إضافة خيار</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-16 text-center">#</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">اسم الخيار</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">نوع العرض</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">القيم المتاحة</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">عدد القيم</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left pl-8">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredOptions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                            <p className="font-medium">لا توجد خيارات مضافة</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOptions.map((option, index) => (
                                    <tr key={option.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                                        <td className="px-6 py-4 text-sm text-gray-400 text-center font-mono">{String(index + 1).padStart(2, '0')}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{option.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(option.type)}`}>
                                                {getTypeLabel(option.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {option.values?.slice(0, 4).map((value) => (
                                                    <span key={value.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                                                        {option.type === 'color' && value.value && (
                                                            <span className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: value.value }}></span>
                                                        )}
                                                        {value.name}
                                                    </span>
                                                ))}
                                                {option.values?.length > 4 && (
                                                    <span className="inline-flex items-center justify-center px-1.5 py-1 rounded-md bg-gray-50 text-xs font-bold text-gray-400">
                                                        +{option.values.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono font-bold">
                                            {option.values?.length || 0}
                                        </td>
                                        <td className="px-6 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(option)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="تعديل">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(option)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف">
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
                    <span>عرض {filteredOptions.length} نتيجة</span>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-8 animate-fade-in relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-gray-900 to-gray-700"></div>

                        <div className="flex items-center justify-between mb-6 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{editingOption ? 'تعديل الخيار' : 'إضافة خيار جديد'}</h2>
                                <p className="text-sm text-gray-500 mt-1">قم بتعريف الخيار وقيمه المتاحة للمنتجات</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">اسم الخيار <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-100 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-medium"
                                            placeholder="مثال: الحجم، اللون"
                                            required
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع العرض</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-100 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-medium appearance-none cursor-pointer"
                                            disabled={submitting}
                                        >
                                            <option value="select">قائمة منسدلة (Dropdown)</option>
                                            <option value="radio">أزرار اختيار (Radio)</option>
                                            <option value="color">ألوان (Color Swatch)</option>
                                            <option value="text">نص (Text)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Values Section */}
                                <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5">
                                    <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        إدارة القيم
                                    </label>

                                    <div className="flex gap-3 mb-4">
                                        <input
                                            type="text"
                                            placeholder="اسم القيمة (مثال: أحمر، XL)"
                                            value={valueInput.name}
                                            onChange={(e) => setValueInput({ ...valueInput, name: e.target.value })}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all text-sm"
                                            disabled={submitting}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                                        />
                                        {formData.type === 'color' && (
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={valueInput.value || '#000000'}
                                                    onChange={(e) => setValueInput({ ...valueInput, value: e.target.value })}
                                                    className="w-10 h-10 p-0.5 rounded-xl border border-gray-200 cursor-pointer overflow-hidden"
                                                    disabled={submitting}
                                                />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={addValue}
                                            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                            disabled={submitting}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            إضافة
                                        </button>
                                    </div>

                                    {/* Values List */}
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {formData.values.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                                لا توجد قيم مضافة بعد
                                            </div>
                                        ) : (
                                            formData.values.map((value, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl group hover:border-gray-300 transition-all shadow-sm">
                                                    {formData.type === 'color' && value.value && (
                                                        <span
                                                            className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
                                                            style={{ backgroundColor: value.value }}
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 text-sm">{value.name}</p>
                                                        {formData.type === 'color' && <p className="text-xs text-gray-400 font-mono mt-0.5">{value.value}</p>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeValue(index)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        disabled={submitting}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6 flex-shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors" disabled={submitting}>إلغاء</button>
                            <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">{submitting ? 'جاري الحفظ...' : (editingOption ? 'حفظ التغييرات' : 'إضافة الخيار')}</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="حذف الخيار"
                message={`هل أنت متأكد من حذف الخيار "${optionToDelete?.name}"؟ قد يؤثر هذا على المنتجات المرتبطة به.`}
                confirmText="نعم، احذف الخيار"
                cancelText="تراجع"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
