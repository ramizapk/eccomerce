'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

// --- Components ---

const InvoiceContent = ({ order }) => {
    if (!order) return null;
    return (
        <div className="p-12 bg-white text-gray-900 font-cairo" dir="rtl">
            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2">فاتورة ضريبية</h1>
                    <p className="text-gray-500 font-bold">رقم الطلب: <span className="font-mono">#{order.id}</span></p>
                    <p className="text-gray-500 font-bold">التاريخ: {new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                </div>
                <div className="text-left">
                    <h2 className="text-2xl font-black mb-2">SALASAH</h2>
                    <p className="text-sm text-gray-500">متجر سلالة المتكامل</p>
                    <p className="text-sm text-gray-500">الرياض، المملكة العربية السعودية</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 tracking-widest">موجّه إلى:</h3>
                    <p className="text-lg font-black">{order.user?.name}</p>
                    <p className="text-gray-600">{order.user?.email}</p>
                    <p className="text-gray-600">{order.user?.phone}</p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {order.shipping_address?.city}, {order.shipping_address?.district}<br />
                            {order.shipping_address?.address_details}
                        </p>
                    </div>
                </div>
                <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 tracking-widest text-left">تفاصيل الدفع:</h3>
                    <p className="text-lg font-black">{order.payment_method === 'cash' ? 'دفع عند الاستلام' : order.payment_method === 'stripe' ? 'بطاقة ائتمان' : 'محفظة سلالة'}</p>
                    <p className={`font-bold ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {order.payment_status === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}
                    </p>
                </div>
            </div>

            <table className="w-full mb-12">
                <thead>
                    <tr className="border-b-2 border-gray-900">
                        <th className="py-4 text-right font-black">المنتج</th>
                        <th className="py-4 text-center font-black">الكمية</th>
                        <th className="py-4 text-center font-black">سعر الوحدة</th>
                        <th className="py-4 text-left font-black">الإجمالي</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item) => (
                        <tr key={item.id}>
                            <td className="py-4">
                                <p className="font-black text-gray-900">{item.product_name}</p>
                                {item.variant?.name && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                                <p className="text-[10px] text-gray-400 italic">بواسطة: {item.store?.store_name}</p>
                            </td>
                            <td className="py-4 text-center font-bold">{item.quantity}</td>
                            <td className="py-4 text-center font-bold">{parseFloat(item.unit_price).toLocaleString()} ريال</td>
                            <td className="py-4 text-left font-black">{parseFloat(item.total).toLocaleString()} ريال</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-gray-500 font-bold">
                        <span>المجموع الفرعي:</span>
                        <span>{parseFloat(order.subtotal).toLocaleString()} ريال</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                        <span>قيمة التوصيل:</span>
                        <span>{parseFloat(order.delivery_price).toLocaleString()} ريال</span>
                    </div>
                    {parseFloat(order.tax_amount) > 0 && (
                        <div className="flex justify-between text-gray-500 font-bold">
                            <span>ضريبة القيمة المضافة:</span>
                            <span>{parseFloat(order.tax_amount).toLocaleString()} ريال</span>
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-black text-gray-900 border-t-2 border-gray-900 pt-3">
                        <span>الإجمالي:</span>
                        <span>{parseFloat(order.total).toLocaleString()} ريال</span>
                    </div>
                </div>
            </div>

            <div className="mt-24 text-center border-t border-gray-100 pt-8">
                <p className="text-gray-400 text-sm font-bold">شكراً لتسوقكم معنا في سلالة!</p>
            </div>
        </div>
    );
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const invoiceRef = useRef();

    useEffect(() => {
        loadOrders(currentPage);
    }, [currentPage]);

    const loadOrders = async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.getOrders({ page });
            if (response.success) {
                const paginatedData = response.data;
                setOrders(paginatedData?.data || response.data || []);
                setTotalPages(paginatedData?.last_page || 1);
                setTotalOrders(paginatedData?.total || (paginatedData?.data || response.data || []).length);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error('حدث خطأ أثناء تحميل الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        // For critical actions, show confirm dialog
        if (['cancelled', 'rejected'].includes(newStatus)) {
            setConfirmDialog({
                title: newStatus === 'cancelled' ? 'تأكيد إلغاء الطلب' : 'تأكيد رفض الطلب',
                message: newStatus === 'cancelled' ? 'هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.' : 'هل أنت متأكد من رفض هذا الطلب؟',
                onConfirm: () => executeStatusChange(orderId, newStatus),
            });
            return;
        }
        await executeStatusChange(orderId, newStatus);
    };

    const executeStatusChange = async (orderId, newStatus) => {
        try {
            const response = await api.updateOrderStatus(orderId, newStatus);
            toast.success('تم تحديث حالة الطلب بنجاح');
            loadOrders(currentPage);
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(response.data || { ...selectedOrder, status: newStatus });
            }
            setConfirmDialog(null);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(error.message || 'حدث خطأ أثناء تحديث الحالة');
        }
    };

    const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
        try {
            const response = await api.updateOrderPaymentStatus(orderId, newPaymentStatus);
            toast.success('تم تحديث حالة الدفع بنجاح');
            loadOrders(currentPage);
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(response.data || { ...selectedOrder, payment_status: newPaymentStatus });
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error(error.message || 'حدث خطأ أثناء تحديث حالة الدفع');
        }
    };

    const handleViewOrder = async (order) => {
        try {
            setDetailLoading(true);
            setSelectedOrder(order);
            const response = await api.getOrder(order.id);
            if (response.success) {
                setSelectedOrder(response.data);
            }
        } catch (error) {
            console.error('Error loading order details:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            const matchesSearch =
                String(order.id).includes(searchQuery) ||
                (order.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.user?.phone || '').includes(searchQuery);

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;

            let matchesDate = true;
            if (dateFrom) matchesDate = matchesDate && orderDate >= new Date(dateFrom);
            if (dateTo) matchesDate = matchesDate && orderDate <= new Date(dateTo + 'T23:59:59');

            return matchesSearch && matchesStatus && matchesPayment && matchesDate;
        });
    }, [orders, searchQuery, statusFilter, paymentFilter, dateFrom, dateTo]);

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: selectedOrder ? `Invoice-${selectedOrder.id}` : 'Invoice',
    });

    const getStatusStyles = (status) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-600 border-amber-100',
            approved: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            processing: 'bg-blue-50 text-blue-600 border-blue-100',
            out_for_delivery: 'bg-violet-50 text-violet-600 border-violet-100',
            delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
            rejected: 'bg-gray-100 text-gray-500 border-gray-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'قيد الانتظار',
            approved: 'تم القبول',
            processing: 'قيد التجهيز',
            out_for_delivery: 'خرج للتوصيل',
            delivered: 'تم التوصيل',
            cancelled: 'ملغي',
            rejected: 'مرفوض',
        };
        return texts[status] || status;
    };

    const exportToCSV = () => {
        const headers = ['رقم الطلب', 'التاريخ', 'العميل', 'عدد المنتجات', 'الإجمالي', 'الحالة', 'طريقة الدفع'];
        const rows = filteredOrders.map(o => [
            o.id,
            new Date(o.created_at).toLocaleDateString('ar-SA'),
            o.user?.name,
            o.items_count,
            o.total,
            getStatusText(o.status),
            o.payment_method
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(',')
            + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stats = useMemo(() => {
        return {
            total: totalOrders || orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            active: orders.filter(o => ['approved', 'processing', 'out_for_delivery'].includes(o.status)).length,
            completed: orders.filter(o => o.status === 'delivered').length,
            totalRevenue: orders.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0)
        };
    }, [orders, totalOrders]);

    return (
        <div className="space-y-8 font-cairo" dir="rtl">
            {/* Hidden Printable Invoice */}
            <div style={{ display: 'none' }}>
                <div ref={invoiceRef}>
                    <InvoiceContent order={selectedOrder} />
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">إدارة الطلبات</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">نظام إدارة العمليات اللوجستية والمالية المتكامل</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>تصدير البيانات</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-indigo-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-indigo-50 transition-all">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">إجمالي الطلبات</p>
                    <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-amber-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-amber-50 rounded-xl">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-amber-500 uppercase mb-1">بانتظار الموافقة</p>
                    <p className="text-2xl font-black text-gray-900">{stats.pending}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-blue-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-blue-50 rounded-xl">
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-blue-500 uppercase mb-1">نشطة حالياً</p>
                    <p className="text-2xl font-black text-gray-900">{stats.active}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-emerald-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-500 uppercase mb-1">تم تسليمها</p>
                    <p className="text-2xl font-black text-gray-900">{stats.completed}</p>
                </div>
                <div className="bg-gray-900 p-5 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">إيرادات المنصة</p>
                        <p className="text-2xl font-black">{stats.totalRevenue.toLocaleString()} <span className="text-xs font-medium opacity-50">ريال</span></p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                {/* Advanced Toolbar */}
                <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between bg-gray-50/30">
                    <div className="flex flex-wrap flex-1 gap-4 items-center">
                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 sm:text-sm transition-all shadow-sm font-medium"
                                placeholder="رقم الطلب، اسم العميل..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5"
                        >
                            <option value="all">كل الحالات</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="approved">تم القبول</option>
                            <option value="processing">جاري التجهيز</option>
                            <option value="out_for_delivery">خرج للتوصيل</option>
                            <option value="delivered">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                        </select>

                        {/* Payment Filter */}
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-white px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5"
                        >
                            <option value="all">كل طرق الدفع</option>
                            <option value="cash">كاش (عند الاستلام)</option>
                            <option value="stripe">بطاقة (أونلاين)</option>
                            <option value="wallet">المحفظة</option>
                        </select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-xl shadow-sm">
                            <span className="text-[10px] font-black text-gray-400 uppercase">من</span>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs border-none focus:ring-0 p-0" />
                            <span className="text-gray-200">|</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">إلى</span>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs border-none focus:ring-0 p-0" />
                        </div>
                    </div>
                </div>

                {/* Overhauled Table */}
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">المعرف</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">العميل</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">محتوى الطلب</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">الدفع</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">الإجمالي</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">الحالة</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-left pl-8">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                [1, 2, 3, 4, 5, 6].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-12 mx-auto"></div></td>
                                        <td className="px-6 py-6"><div className="flex gap-3"><div className="w-10 h-10 bg-gray-50 rounded-full"></div><div><div className="h-4 bg-gray-100 rounded w-24 mb-2"></div><div className="h-3 bg-gray-50 rounded w-16"></div></div></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-6"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                        <td className="px-6 py-6"><div className="h-8 bg-gray-100 rounded w-32 mr-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                                <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            </div>
                                            <p className="text-gray-400 font-bold">لم يتم العثور على أي طلبات تطابق بحثك</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-all group border-b border-gray-50/50">
                                        <td className="px-6 py-6 text-center">
                                            <span className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-xs font-black font-mono tracking-tight group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                #{order.id}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-2 font-bold">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm">
                                                    {order.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{order.user?.name}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">{order.user?.phone || order.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-900 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">{order.items_count} منتجات</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black text-gray-900 uppercase tracking-tighter">
                                                    {order.payment_method === 'cash' ? '💵 كاش' : order.payment_method === 'stripe' ? '💳 أونلاين' : '💰 محفظة'}
                                                </span>
                                                <span className={`text-[10px] font-bold ${order.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {order.payment_status === 'paid' ? 'تم الدفع' : 'بانتظار الدفع'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-base font-black text-gray-900">{parseFloat(order.total).toLocaleString()} <span className="text-[10px] opacity-40 font-bold">ريال</span></span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black border tracking-tight shadow-sm ${getStatusStyles(order.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'delivered' ? 'bg-emerald-500' :
                                                    order.status === 'pending' ? 'bg-amber-500' :
                                                        order.status === 'cancelled' ? 'bg-rose-500' : 'bg-indigo-500'
                                                    }`}></span>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                                                    title="عرض وتعديل"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <div className="relative group/select">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className="appearance-none bg-gray-100 border-none text-[11px] font-black py-2.5 px-4 rounded-xl pr-9 focus:ring-4 focus:ring-indigo-100 cursor-pointer shadow-sm group-hover:bg-gray-200 transition-colors"
                                                    >
                                                        <option value="pending">تعليق</option>
                                                        <option value="approved">قبول</option>
                                                        <option value="processing">تجهيز</option>
                                                        <option value="out_for_delivery">توصيل</option>
                                                        <option value="delivered">تسليم</option>
                                                        <option value="cancelled">إلغاء</option>
                                                        <option value="rejected">رفض</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with Pagination */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col md:flex-row items-center justify-between text-sm gap-4">
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold">عرض <span className="text-gray-900">{filteredOrders.length}</span> من أصل <span className="text-gray-900">{totalOrders}</span> طلب</span>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >السابق</button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let page;
                                    if (totalPages <= 5) { page = i + 1; }
                                    else if (currentPage <= 3) { page = i + 1; }
                                    else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
                                    else { page = currentPage - 2 + i; }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm ${currentPage === page
                                                ? 'bg-indigo-600 text-white shadow-indigo-200'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >{page}</button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >التالي</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Overhauled Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"></div>

                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">تفاصيل الطلب <span className="font-mono text-indigo-600 font-bold">#{selectedOrder.id}</span></h2>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border shadow-sm ${getStatusStyles(selectedOrder.status)}`}>
                                        {getStatusText(selectedOrder.status)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 font-bold">سجّل بواسطة {selectedOrder.user?.name} في {new Date(selectedOrder.created_at).toLocaleString('ar-SA')}
                                    {selectedOrder.updated_at && selectedOrder.updated_at !== selectedOrder.created_at && (
                                        <span className="text-gray-300 mr-2">| آخر تحديث: {new Date(selectedOrder.updated_at).toLocaleString('ar-SA')}</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="p-3 bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all shadow-sm flex items-center gap-2 text-sm font-bold"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm3-7V7a3 3 0 116 0v4m-6 0h6" /></svg>
                                    طباعة الفاتورة
                                </button>
                                <button onClick={() => setSelectedOrder(null)} className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Right Side: Customer & Address */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Customer Card */}
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">العميل</h3>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
                                                {selectedOrder.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-gray-900 leading-none mb-1">{selectedOrder.user?.name}</p>
                                                <p className="text-xs text-gray-500 font-bold">{selectedOrder.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="text-sm font-black text-gray-900">{selectedOrder.user?.phone || 'لا يوجد هاتف'}</span>
                                        </div>
                                    </div>

                                    {/* Address Card */}
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">عنوان التوصيل</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-4">
                                                <div className="shrink-0 p-2 bg-indigo-50 rounded-lg">
                                                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                                <p className="text-sm font-black text-gray-900 leading-relaxed">
                                                    {selectedOrder.shipping_address?.city} - {selectedOrder.shipping_address?.district}<br />
                                                    <span className="text-xs text-gray-500 font-bold">{selectedOrder.shipping_address?.address_details}</span>
                                                </p>
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.shipping_address?.latitude},${selectedOrder.shipping_address?.longitude}`}
                                                target="_blank"
                                                className="block w-full text-center py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200 hover:bg-black transition-all"
                                            >
                                                فتح في خرائط جوجل
                                            </a>
                                        </div>
                                    </div>

                                    {/* Payment Info Card */}
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">معلومات الدفع</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                <span className="text-xs font-bold text-gray-500">طريقة الدفع</span>
                                                <span className="text-sm font-black text-gray-900">
                                                    {selectedOrder.payment_method === 'cash' ? '💵 دفع عند الاستلام' : selectedOrder.payment_method === 'stripe' ? '💳 بطاقة ائتمان' : '💰 المحفظة'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                <span className="text-xs font-bold text-gray-500">حالة الدفع</span>
                                                <span className={`text-sm font-black px-3 py-1 rounded-lg ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                        selectedOrder.payment_status === 'failed' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {selectedOrder.payment_status === 'paid' ? '✅ مدفوع' : selectedOrder.payment_status === 'failed' ? '❌ فشل' : '⏳ بانتظار الدفع'}
                                                </span>
                                            </div>
                                            {selectedOrder.payment_status !== 'paid' && (
                                                <button
                                                    onClick={() => handlePaymentStatusChange(selectedOrder.id, 'paid')}
                                                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                                                >تأكيد الدفع يدوياً</button>
                                            )}
                                            {selectedOrder.payment_status === 'paid' && (
                                                <button
                                                    onClick={() => handlePaymentStatusChange(selectedOrder.id, 'unpaid')}
                                                    className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                                                >إلغاء الدفع</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes Card */}
                                    {selectedOrder.notes && (
                                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ملاحظات العميل</h3>
                                            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedOrder.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Left Side: Timeline & Items */}
                                <div className="lg:col-span-2 space-y-8">

                                    {/* Order Timeline Block */}
                                    <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">خط الإنتاج والتنفيذ</h3>
                                        <div className="relative flex justify-between items-center max-w-lg mx-auto">
                                            {/* Timeline Line */}
                                            <div className="absolute h-0.5 bg-gray-800 w-full top-6"></div>
                                            <div className={`absolute h-0.5 bg-indigo-500 top-6 transition-all duration-1000`} style={{
                                                width: selectedOrder.status === 'pending' ? '0%' :
                                                    selectedOrder.status === 'approved' ? '25%' :
                                                        selectedOrder.status === 'processing' ? '50%' :
                                                            selectedOrder.status === 'out_for_delivery' ? '75%' : '100%'
                                            }}></div>

                                            {/* Steps */}
                                            {[
                                                { id: 'pending', icon: '📝', label: 'طلب جديد' },
                                                { id: 'approved', icon: '✅', label: 'تم القبول' },
                                                { id: 'processing', icon: '📦', label: 'تجهيز' },
                                                { id: 'out_for_delivery', icon: '🚚', label: 'توصيل' },
                                                { id: 'delivered', icon: '🏠', label: 'استلام' }
                                            ].map((step, idx) => {
                                                const statuses = ['pending', 'approved', 'processing', 'out_for_delivery', 'delivered'];
                                                const currentIdx = statuses.indexOf(selectedOrder.status);
                                                const isCompleted = currentIdx >= idx;
                                                const isActive = currentIdx === idx;

                                                return (
                                                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all border-2 ${isCompleted ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-800 border-gray-700'
                                                            } ${isActive ? 'scale-125 ring-4 ring-indigo-500/20 shadow-indigo-500/40' : ''}`}>
                                                            {step.icon}
                                                        </div>
                                                        <span className={`text-[10px] font-black mt-3 whitespace-nowrap ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden pb-4">
                                        <div className="p-6 border-b border-gray-50 bg-gray-50/20">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">محتويات الشحنة</h3>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {selectedOrder.items?.map((item) => (
                                                <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-gray-50/50 transition-all">
                                                    <div className="w-20 h-20 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm shrink-0">
                                                        {item.product_image ? (
                                                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-base font-black text-gray-900 truncate mb-1">{item.product_name}</p>
                                                        <div className="flex flex-wrap gap-2 items-center">
                                                            <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">ID: {item.product_id}</span>
                                                            <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md">بواسطة: {item.store?.store_name}</span>
                                                            {item.variant?.name && <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md">{item.variant.name}</span>}
                                                            {item.variant?.sku && <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">SKU: {item.variant.sku}</span>}
                                                        </div>
                                                        {item.options && Object.keys(item.options).length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {Object.entries(item.options).map(([key, value]) => (
                                                                    <span key={key} className="text-[10px] font-black px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md">
                                                                        {key}: {value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-left shrink-0">
                                                        <p className="text-xs font-black text-gray-400 mb-1">{item.quantity} × {parseFloat(item.unit_price).toLocaleString()} ريال</p>
                                                        <p className="text-lg font-black text-gray-900">{parseFloat(item.total).toLocaleString()} <span className="text-[10px] opacity-40 font-bold">ريال</span></p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المجموع الفرعي</p>
                                                <p className="text-xl font-black text-gray-900">{parseFloat(selectedOrder.subtotal).toLocaleString()} <span className="text-xs font-bold opacity-30">ريال</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">التوصيل</p>
                                                <p className="text-xl font-black text-gray-900">{parseFloat(selectedOrder.delivery_price).toLocaleString()} <span className="text-xs font-bold opacity-30">ريال</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الضريبة</p>
                                                <p className="text-xl font-black text-gray-900">{parseFloat(selectedOrder.tax_amount).toLocaleString()} <span className="text-xs font-bold opacity-30">ريال</span></p>
                                            </div>
                                            <div className="p-4 bg-gray-900 rounded-3xl text-white shadow-xl shadow-indigo-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">صافي الإجمالي</p>
                                                <p className="text-3xl font-black">{parseFloat(selectedOrder.total).toLocaleString()} <span className="text-sm font-bold opacity-40">ريال</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="p-8 border-t border-gray-100 bg-white shrink-0 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-sm font-black text-gray-400">تغيير الحالة سريعاً:</span>
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { id: 'approved', label: 'قبول', color: 'bg-indigo-600' },
                                        { id: 'processing', label: 'تجهيز', color: 'bg-blue-600' },
                                        { id: 'out_for_delivery', label: 'توصيل', color: 'bg-violet-600' },
                                        { id: 'delivered', label: 'تم التسليم', color: 'bg-emerald-600' }
                                    ].map(btn => (
                                        <button
                                            key={btn.id}
                                            onClick={() => handleStatusChange(selectedOrder.id, btn.id)}
                                            className={`px-6 py-2.5 ${btn.color} text-white text-xs font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all ${selectedOrder.status === btn.id ? 'ring-4 ring-indigo-100 opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={selectedOrder.status === btn.id}
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                                    disabled={selectedOrder.status === 'cancelled'}
                                    className="px-5 py-2.5 bg-rose-50 text-rose-600 text-xs font-black rounded-xl border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >إلغاء</button>
                                <button
                                    onClick={() => handleStatusChange(selectedOrder.id, 'rejected')}
                                    disabled={selectedOrder.status === 'rejected'}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-600 text-xs font-black rounded-xl border border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >رفض</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.696 0L4.168 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">{confirmDialog.title}</h3>
                        <p className="text-sm text-gray-500 font-medium mb-8">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-black hover:bg-gray-200 transition-all"
                            >إلغاء</button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-8 py-3 bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
                            >تأكيد</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.98) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media print {
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}
