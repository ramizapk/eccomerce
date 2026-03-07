'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminsPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        status: 'active',
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const response = await api.getUsers({ role: 'super_admin' });
            if (response.success) {
                setAdmins(response.data?.data || response.data || []);
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            toast.error('حدث خطأ أثناء تحميل المسؤولين');
        } finally {
            setLoading(false);
        }
    };

    const filteredAdmins = useMemo(() => {
        return admins.filter(admin => {
            const matchesSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                admin.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [admins, searchQuery, statusFilter]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Password validation
        if (formData.password) {
            if (formData.password.length < 8) {
                return toast.error('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
            }
        } else if (!editingAdmin) {
            // Password is required for new admins
            return toast.error('كلمة المرور مطلوبة للمسؤول الجديد');
        }

        setSubmitting(true);

        try {
            const submitData = { ...formData, role: 'super_admin' };
            if (editingAdmin && !formData.password) {
                delete submitData.password;
            }

            if (editingAdmin) {
                await api.updateUser(editingAdmin.id, submitData);
                toast.success('تم تحديث المسؤول بنجاح');
            } else {
                await api.createUser(submitData);
                toast.success('تم إضافة المسؤول بنجاح');
            }

            setShowModal(false);
            setEditingAdmin(null);
            setFormData({ name: '', email: '', password: '', status: 'active' });
            loadAdmins();
        } catch (error) {
            console.error('Error saving admin:', error);
            toast.error(error.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '',
            status: admin.status || 'active',
        });
        setShowModal(true);
    };

    const handleDelete = (admin) => {
        setAdminToDelete(admin);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!adminToDelete) return;

        try {
            setIsDeleting(true);
            await api.deleteUser(adminToDelete.id);
            toast.success('تم حذف المسؤول بنجاح');
            setDeleteModalOpen(false);
            setAdminToDelete(null);
            loadAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
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
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة المسؤولين</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">عرض وإدارة حسابات المسؤولين (Super Admins)</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase">الكل</span>
                        <span className="text-lg font-black text-gray-900">{admins.length}</span>
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
                                placeholder="بحث بالاسم أو البريد..."
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
                            setEditingAdmin(null);
                            setFormData({ name: '', email: '', password: '', status: 'active' });
                            setShowModal(true);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        <span>إضافة مسؤول</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-16 text-center">#</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الاسم</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">البريد الإلكتروني</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الصلاحية</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">تاريخ الانضمام</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left pl-8">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-xl"></div><div className="h-4 bg-gray-100 rounded w-32"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            <p className="font-medium">لا يوجد مسؤولين بهذا الاسم</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin, index) => (
                                    <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                                        <td className="px-6 py-4 text-sm text-gray-400 text-center font-mono">{String(index + 1).padStart(2, '0')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${index % 2 === 0 ? 'bg-gradient-to-br from-purple-500 to-indigo-700' : 'bg-gradient-to-br from-fuchsia-500 to-purple-600'
                                                    }`}>
                                                    {admin.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">{admin.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{admin.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                                Super Admin
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(admin.created_at).toLocaleDateString('ar-SA')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${admin.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                {admin.status === 'active' ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(admin)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="تعديل">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(admin)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف">
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
                    <span>عرض {filteredAdmins.length} نتيجة</span>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{editingAdmin ? 'تعديل المسؤول' : 'إضافة مسؤول جديد'}</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none font-medium" required disabled={submitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none font-medium text-left dir-ltr" required disabled={submitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور {editingAdmin && <span className="text-xs font-normal text-gray-500">(اختياري للمسؤولين الحاليين)</span>}</label>
                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none font-medium dir-ltr" required={!editingAdmin} disabled={submitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'active' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={() => setFormData({ ...formData, status: 'active' })} className="hidden" />
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="font-bold text-sm">نشط</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.status === 'inactive' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={() => setFormData({ ...formData, status: 'inactive' })} className="hidden" />
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span><span className="font-bold text-sm">غير نشط</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <div>
                                    <p className="text-sm font-bold text-amber-800">صلاحيات كاملة</p>
                                    <p className="text-xs text-amber-700 mt-1">هذا الحساب سيمتلك صلاحيات Super Admin ويمكنه التحكم في كامل النظام.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors" disabled={submitting}>إلغاء</button>
                                <button type="submit" disabled={submitting} className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">{submitting ? 'جاري الحفظ...' : (editingAdmin ? 'حفظ التغييرات' : 'إضافة المسؤول')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="حذف المسؤول"
                message={`هل أنت متأكد من حذف المسؤول "${adminToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه وسيتم سحب كافة الصلاحيات فوراً.`}
                confirmText="نعم، احذف المسؤول"
                cancelText="تراجع"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
