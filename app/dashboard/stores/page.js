'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

const STATUS_CONFIG = {
    pending: { label: 'معلق', color: 'yellow', icon: '⏳' },
    approved: { label: 'مقبول', color: 'emerald', icon: '✅' },
    rejected: { label: 'مرفوض', color: 'red', icon: '❌' },
    suspended: { label: 'معلّق', color: 'orange', icon: '⏸️' },
};

const STATUS_COLOR_MAP = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
};
const STATUS_DOT_MAP = {
    yellow: 'bg-yellow-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR_MAP[config.color]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_MAP[config.color]}`}></span>
            {config.label}
        </span>
    );
}

function FormInput({ label, name, type = 'text', required = false, placeholder = '', value, onChange, error, ...props }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${error ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'}`}
                placeholder={placeholder}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium">{error[0]}</p>
            )}
        </div>
    );
}

const EMPTY_FORM = {
    store_name: '',
    tax_number: '',
    commercial_register: '',
    address: '',
    city: '',
    country: '',
    description: '',
    logo: null,
    status: 'pending',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_password: '',
};

export default function StoresPage() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Form Modal
    const [formModal, setFormModal] = useState({ isOpen: false, mode: 'create', store: null });
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Detail Modal
    const [detailModal, setDetailModal] = useState({ isOpen: false, store: null });

    // Reject Modal
    const [rejectModal, setRejectModal] = useState({ isOpen: false, storeId: null, reason: '', isProcessing: false });

    // Confirm Modal (for approve/suspend/delete)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, storeId: null, action: null, isProcessing: false
    });

    useEffect(() => {
        loadStores();
    }, [pagination.current_page]);

    const loadStores = async (page = pagination.current_page) => {
        try {
            setLoading(true);
            const params = { page, per_page: 15 };
            const response = await api.getStores(params);
            const storesData = response.data?.data || response.data || [];
            setStores(Array.isArray(storesData) ? storesData : []);

            // Handle pagination
            if (response.data?.meta) {
                setPagination({
                    current_page: response.data.meta.current_page,
                    last_page: response.data.meta.last_page,
                    total: response.data.meta.total,
                });
            } else if (response.meta) {
                setPagination({
                    current_page: response.meta.current_page,
                    last_page: response.meta.last_page,
                    total: response.meta.total,
                });
            }
        } catch (error) {
            console.error('Error loading stores:', error);
            toast.error('حدث خطأ أثناء تحميل المتاجر');
        } finally {
            setLoading(false);
        }
    };

    // --- Filtering ---
    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const matchesSearch =
                (store.store_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (store.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (store.tax_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (store.owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (store.owner?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filter === 'all' || store.status === filter;
            return matchesSearch && matchesFilter;
        });
    }, [stores, searchQuery, filter]);

    const statusCounts = useMemo(() => {
        const counts = { all: stores.length, pending: 0, approved: 0, rejected: 0, suspended: 0 };
        stores.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });
        return counts;
    }, [stores]);

    // --- Create / Edit ---
    const openCreateModal = () => {
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setFormModal({ isOpen: true, mode: 'create', store: null });
    };

    const openEditModal = (store) => {
        setFormData({
            store_name: store.store_name || '',
            tax_number: store.tax_number || '',
            commercial_register: store.commercial_register || '',
            address: store.address || '',
            city: store.city || '',
            country: store.country || '',
            description: store.description || '',
            logo: null,
            status: store.status || 'pending',
            owner_name: '', owner_email: '', owner_phone: '', owner_password: '',
        });
        setFormErrors({});
        setFormModal({ isOpen: true, mode: 'edit', store });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormErrors({});

        try {
            const fd = new FormData();

            // Store fields
            const storeFields = ['store_name', 'tax_number', 'commercial_register', 'address', 'city', 'country', 'description'];
            storeFields.forEach(key => {
                if (formData[key]) fd.append(key, formData[key]);
            });

            if (formData.logo instanceof File) {
                fd.append('logo', formData.logo);
            }

            if (formModal.mode === 'create') {
                fd.append('status', formData.status);
                fd.append('owner_name', formData.owner_name);
                fd.append('owner_email', formData.owner_email);
                fd.append('owner_phone', formData.owner_phone);
                fd.append('owner_password', formData.owner_password);
                await api.createStore(fd);
                toast.success('تم إنشاء المتجر بنجاح');
            } else {
                await api.updateStore(formModal.store.id, fd);
                toast.success('تم تحديث المتجر بنجاح');
            }

            setFormModal({ isOpen: false, mode: 'create', store: null });
            loadStores();
        } catch (error) {
            if (error.errors) {
                setFormErrors(error.errors);
            }
            toast.error(error.message || 'حدث خطأ');
        } finally {
            setFormLoading(false);
        }
    };

    // --- Status Actions ---
    const handleApprove = (storeId) => {
        setConfirmModal({ isOpen: true, storeId, action: 'approved', isProcessing: false });
    };

    const handleSuspend = (storeId) => {
        setConfirmModal({ isOpen: true, storeId, action: 'suspended', isProcessing: false });
    };

    const handleReactivate = (storeId) => {
        setConfirmModal({ isOpen: true, storeId, action: 'approved', isProcessing: false });
    };

    const confirmAction = async () => {
        const { storeId, action } = confirmModal;
        try {
            setConfirmModal(prev => ({ ...prev, isProcessing: true }));
            await api.updateStoreStatus(storeId, action);
            toast.success('تم تحديث حالة المتجر بنجاح');
            setConfirmModal({ isOpen: false, storeId: null, action: null, isProcessing: false });
            loadStores();
        } catch (error) {
            toast.error(error.message || 'حدث خطأ أثناء تحديث الحالة');
        } finally {
            setConfirmModal(prev => ({ ...prev, isProcessing: false }));
        }
    };

    const openRejectModal = (storeId) => {
        setRejectModal({ isOpen: true, storeId, reason: '', isProcessing: false });
    };

    const confirmReject = async () => {
        const { storeId, reason } = rejectModal;
        if (!reason.trim()) {
            toast.error('يجب كتابة سبب الرفض');
            return;
        }
        try {
            setRejectModal(prev => ({ ...prev, isProcessing: true }));
            await api.updateStoreStatus(storeId, 'rejected', reason);
            toast.success('تم رفض المتجر');
            setRejectModal({ isOpen: false, storeId: null, reason: '', isProcessing: false });
            loadStores();
        } catch (error) {
            toast.error(error.message || 'حدث خطأ');
        } finally {
            setRejectModal(prev => ({ ...prev, isProcessing: false }));
        }
    };

    // --- Delete ---
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, storeId: null, isProcessing: false });

    const handleDelete = (storeId) => {
        setDeleteModal({ isOpen: true, storeId, isProcessing: false });
    };

    const confirmDelete = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, isProcessing: true }));
            await api.deleteStore(deleteModal.storeId);
            toast.success('تم حذف المتجر بنجاح');
            setDeleteModal({ isOpen: false, storeId: null, isProcessing: false });
            loadStores();
        } catch (error) {
            toast.error(error.message || 'حدث خطأ أثناء الحذف');
        } finally {
            setDeleteModal(prev => ({ ...prev, isProcessing: false }));
        }
    };

    // --- Detail ---
    const openDetailModal = (store) => {
        setDetailModal({ isOpen: true, store });
    };

    // Helper to render a form input inline
    const renderInput = (label, name, type = 'text', required = false, placeholder = '') => (
        <FormInput
            key={name}
            label={label}
            name={name}
            type={type}
            required={required}
            placeholder={placeholder}
            value={formData[name]}
            onChange={e => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
            error={formErrors[name]}
        />
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة المتاجر</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">عرض وإدارة المتاجر والاشتراكات</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    إضافة متجر
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: 'الكل' },
                    { key: 'pending', label: 'معلق' },
                    { key: 'approved', label: 'مقبول' },
                    { key: 'rejected', label: 'مرفوض' },
                    { key: 'suspended', label: 'معلّق' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filter === tab.key
                            ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                        <span className={`mr-2 px-1.5 py-0.5 rounded-md text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                            {statusCounts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                            placeholder="بحث باسم المتجر، المدينة، الرقم الضريبي، أو صاحب المتجر..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-12 text-center">#</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المتجر</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">صاحب المتجر</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">المدينة</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الرقم الضريبي</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">المنتجات</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">التاريخ</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left pl-6">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-6 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg"></div><div className="h-4 bg-gray-100 rounded w-28"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-28 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredStores.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-16 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <svg className="w-14 h-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            <p className="font-bold text-gray-500">لا توجد متاجر</p>
                                            <p className="text-sm">لا توجد متاجر مطابقة للبحث أو الفلتر المحدد</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStores.map((store, index) => (
                                    <tr key={store.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-gray-400 text-center font-mono">{String(index + 1).padStart(2, '0')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {store.logo ? (
                                                    <img src={store.logo} alt={store.store_name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${index % 3 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-700' :
                                                        index % 3 === 1 ? 'bg-gradient-to-br from-teal-500 to-green-600' :
                                                            'bg-gradient-to-br from-emerald-500 to-teal-700'
                                                        }`}>
                                                        {store.store_name?.charAt(0)}
                                                    </div>
                                                )}
                                                <p className="text-sm font-bold text-gray-900">{store.store_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{store.owner?.name || '-'}</p>
                                                <p className="text-xs text-gray-400">{store.owner?.email || ''}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{store.city || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{store.tax_number || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-bold text-center">{store.products_count ?? 0}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={store.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {store.created_at ? new Date(store.created_at).toLocaleDateString('ar-SA') : '-'}
                                        </td>
                                        <td className="px-6 py-4 pl-6">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <button onClick={() => openDetailModal(store)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="عرض التفاصيل">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </button>
                                                <button onClick={() => openEditModal(store)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" title="تعديل">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                </button>
                                                {store.status !== 'approved' && (
                                                    <button onClick={() => handleApprove(store.id)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="قبول">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                    </button>
                                                )}
                                                {store.status === 'pending' && (
                                                    <button onClick={() => openRejectModal(store.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="رفض">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                                {store.status === 'approved' && (
                                                    <button onClick={() => handleSuspend(store.id)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="تعليق">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>
                                                    </button>
                                                )}
                                                {(store.status === 'suspended' || store.status === 'rejected') && (
                                                    <button onClick={() => handleReactivate(store.id)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="إعادة تفعيل">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(store.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="حذف">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <span>عرض {filteredStores.length} من {pagination.total || stores.length} نتيجة</span>
                    {pagination.last_page > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                disabled={pagination.current_page <= 1}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                السابق
                            </button>
                            {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                                let page;
                                if (pagination.last_page <= 5) {
                                    page = i + 1;
                                } else if (pagination.current_page <= 3) {
                                    page = i + 1;
                                } else if (pagination.current_page >= pagination.last_page - 2) {
                                    page = pagination.last_page - 4 + i;
                                } else {
                                    page = pagination.current_page - 2 + i;
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: page }))}
                                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${pagination.current_page === page
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'hover:bg-white border border-gray-200'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                disabled={pagination.current_page >= pagination.last_page}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MODALS ===== */}

            {/* Create/Edit Store Modal */}
            {
                formModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => !formLoading && setFormModal({ isOpen: false, mode: 'create', store: null })} />
                        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden relative my-8" onClick={e => e.stopPropagation()} dir="rtl">
                            {/* Top bar */}
                            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />

                            <form onSubmit={handleFormSubmit}>
                                <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                                    <div className="text-center mb-2">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                            {formModal.mode === 'create' ? 'إضافة متجر جديد' : 'تعديل المتجر'}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {formModal.mode === 'create' ? 'أدخل بيانات المتجر وصاحبه' : 'تعديل بيانات المتجر'}
                                        </p>
                                    </div>

                                    {/* Store Info Section */}
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs">🏪</span>
                                            بيانات المتجر
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {renderInput('اسم المتجر', 'store_name', 'text', true, 'مثل: متجر الرياض')}
                                            {renderInput('الرقم الضريبي', 'tax_number', 'text', true, '3XXXXXXXXXX')}
                                            {renderInput('السجل التجاري', 'commercial_register', 'text', false, 'رقم السجل التجاري')}
                                            {renderInput('المدينة', 'city', 'text', false, 'مثل: الرياض')}
                                            {renderInput('الدولة', 'country', 'text', false, 'مثل: السعودية')}
                                            {renderInput('العنوان', 'address', 'text', false, 'العنوان التفصيلي')}
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                rows={3}
                                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white resize-none"
                                                placeholder="وصف المتجر..."
                                            />
                                        </div>

                                        {/* Logo Upload */}
                                        <div className="mt-4">
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">شعار المتجر</label>
                                            {formModal.mode === 'edit' && formModal.store?.logo && !formData.logo && (
                                                <div className="mb-3 flex items-center gap-3">
                                                    <img src={formModal.store.logo} alt="الشعار الحالي" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                                                    <span className="text-xs text-gray-400">الشعار الحالي</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                onChange={e => setFormData(prev => ({ ...prev, logo: e.target.files[0] || null }))}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all"
                                            />
                                            {formErrors.logo && <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.logo[0]}</p>}
                                        </div>

                                        {/* Status select for create */}
                                        {formModal.mode === 'create' && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">الحالة المبدئية</label>
                                                <select
                                                    value={formData.status}
                                                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                                                >
                                                    <option value="pending">معلق (بانتظار المراجعة)</option>
                                                    <option value="approved">مقبول (تفعيل فوري)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Owner Info Section - Only on Create */}
                                    {formModal.mode === 'create' && (
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">👤</span>
                                                بيانات صاحب المتجر
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {renderInput('الاسم', 'owner_name', 'text', true, 'اسم صاحب المتجر')}
                                                {renderInput('البريد الإلكتروني', 'owner_email', 'email', true, 'example@email.com')}
                                                {renderInput('رقم الهاتف', 'owner_phone', 'text', true, '05XXXXXXXX')}
                                                {renderInput('كلمة المرور', 'owner_password', 'password', true, '8 أحرف على الأقل')}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                                    <button
                                        type="button"
                                        disabled={formLoading}
                                        onClick={() => setFormModal({ isOpen: false, mode: 'create', store: null })}
                                        className="flex-1 px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {formLoading && (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        )}
                                        {formModal.mode === 'create' ? 'إنشاء المتجر' : 'حفظ التغييرات'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Store Detail Modal */}
            {
                detailModal.isOpen && detailModal.store && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setDetailModal({ isOpen: false, store: null })} />
                        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-lg overflow-hidden relative my-8" onClick={e => e.stopPropagation()} dir="rtl">
                            <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                            <div className="p-8">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    {detailModal.store.logo ? (
                                        <img src={detailModal.store.logo} alt={detailModal.store.store_name} className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-gray-100" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                            {detailModal.store.store_name?.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">{detailModal.store.store_name}</h3>
                                        <StatusBadge status={detailModal.store.status} />
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-4">
                                    {[
                                        { label: 'صاحب المتجر', value: detailModal.store.owner?.name },
                                        { label: 'البريد الإلكتروني', value: detailModal.store.owner?.email },
                                        { label: 'رقم الهاتف', value: detailModal.store.owner?.phone },
                                        { label: 'الرقم الضريبي', value: detailModal.store.tax_number },
                                        { label: 'السجل التجاري', value: detailModal.store.commercial_register },
                                        { label: 'المدينة', value: detailModal.store.city },
                                        { label: 'الدولة', value: detailModal.store.country },
                                        { label: 'العنوان', value: detailModal.store.address },
                                        { label: 'عدد المنتجات', value: detailModal.store.products_count ?? 0 },
                                        { label: 'تاريخ التسجيل', value: detailModal.store.created_at ? new Date(detailModal.store.created_at).toLocaleDateString('ar-SA') : '-' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                                            <span className="text-sm font-bold text-gray-900">{item.value || '-'}</span>
                                        </div>
                                    ))}

                                    {detailModal.store.description && (
                                        <div className="pt-2">
                                            <p className="text-sm text-gray-500 font-medium mb-1">الوصف</p>
                                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{detailModal.store.description}</p>
                                        </div>
                                    )}

                                    {detailModal.store.status === 'rejected' && detailModal.store.rejection_reason && (
                                        <div className="pt-2">
                                            <p className="text-sm text-red-500 font-bold mb-1">سبب الرفض</p>
                                            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{detailModal.store.rejection_reason}</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setDetailModal({ isOpen: false, store: null })}
                                    className="w-full mt-6 px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reject Modal */}
            {
                rejectModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => !rejectModal.isProcessing && setRejectModal({ isOpen: false, storeId: null, reason: '', isProcessing: false })} />
                        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()} dir="rtl">
                            <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-600" />
                            <div className="p-8">
                                <div className="flex justify-center mb-6">
                                    <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-red-50">
                                        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-red-100 text-red-600">
                                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">رفض المتجر</h3>
                                    <p className="text-gray-500 font-medium mb-6">يرجى كتابة سبب رفض المتجر</p>
                                </div>

                                <textarea
                                    value={rejectModal.reason}
                                    onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                    rows={4}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white resize-none mb-6"
                                    placeholder="اكتب سبب الرفض هنا... (إجباري)"
                                />

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        disabled={rejectModal.isProcessing}
                                        onClick={() => setRejectModal({ isOpen: false, storeId: null, reason: '', isProcessing: false })}
                                        className="flex-1 px-6 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        تراجع
                                    </button>
                                    <button
                                        type="button"
                                        disabled={rejectModal.isProcessing || !rejectModal.reason.trim()}
                                        onClick={confirmReject}
                                        className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {rejectModal.isProcessing && (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        )}
                                        تأكيد الرفض
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Approve / Suspend Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, storeId: null, action: null, isProcessing: false })}
                onConfirm={confirmAction}
                title={
                    confirmModal.action === 'approved' ? 'قبول المتجر' :
                        confirmModal.action === 'suspended' ? 'تعليق المتجر' : 'تأكيد الإجراء'
                }
                message={
                    confirmModal.action === 'approved' ? 'هل أنت متأكد من قبول هذا المتجر؟ سيتمكن صاحب المتجر من البيع مباشرة.' :
                        confirmModal.action === 'suspended' ? 'هل أنت متأكد من تعليق هذا المتجر؟ لن يتمكن صاحب المتجر من البيع حتى يتم إعادة تفعيله.' :
                            'هل أنت متأكد من هذا الإجراء؟'
                }
                confirmText="تأكيد"
                cancelText="تراجع"
                variant={confirmModal.action === 'approved' ? 'info' : 'danger'}
                loading={confirmModal.isProcessing}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, storeId: null, isProcessing: false })}
                onConfirm={confirmDelete}
                title="حذف المتجر"
                message="هل أنت متأكد من حذف هذا المتجر؟ سيتم حذف جميع بيانات المتجر نهائياً ولا يمكن استرجاعها."
                confirmText="حذف نهائي"
                cancelText="تراجع"
                variant="danger"
                loading={deleteModal.isProcessing}
            />
        </div >
    );
}
