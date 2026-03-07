'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, activitiesRes] = await Promise.all([
                api.getStats(),
                api.getRecentActivities()
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (activitiesRes.success) setActivities(activitiesRes.data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, total, details, icon, color, gradient }) => (
        <div className="relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            {/* Background Gradient Blob */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradient} opacity-10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-500`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-${color}-500/30 ring-4 ring-${color}-50 transition-transform group-hover:scale-110 duration-300`}>
                        {icon}
                    </div>
                    <div className="text-left">
                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{total}</h3>
                    </div>
                </div>

                <h3 className="text-gray-500 font-bold text-lg mb-4">{title}</h3>

                <div className="space-y-2">
                    {details.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500`}></span>
                                {item.label}
                            </span>
                            <span className="font-bold text-gray-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ActivityItem = ({ activity }) => {
        const isUser = activity.type === 'user_registered';
        const isOrder = activity.type === 'order_created';

        return (
            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group cursor-default">
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${isUser ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        isOrder ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-600'
                    }`}>
                    {isUser ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate pr-2" title={activity.title}>{activity.title}</h4>
                        <span className="text-[10px] uppercase font-bold text-gray-400 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
                            {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-medium">{activity.description}</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-64 bg-gray-200 rounded-[2rem]"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">لوحة التحكم</h1>
                    <p className="text-gray-500 font-medium">نظرة عامة على أداء المنصة</p>
                </div>
                <div className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-gray-700">النظام يعمل بكفاءة</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Card */}
                <StatCard
                    title="المستخدمين"
                    total={stats?.users?.total || 0}
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                    color="blue"
                    gradient="from-blue-600 to-indigo-600"
                    details={[
                        { label: 'العملاء', value: stats?.users?.customers, color: 'blue' },
                        { label: 'المتاجر', value: stats?.users?.stores, color: 'purple' },
                        { label: 'المشرفين', value: stats?.users?.admins, color: 'gray' },
                    ]}
                />

                {/* Stores Card */}
                <StatCard
                    title="المتاجر"
                    total={stats?.stores?.total || 0}
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h4.481M6.75 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m13.721-16.376l-2.625 2.625c-.97.97-1.454 2.454-1.454 3.75v1.125c0 .327-.109.645-.27.915l-1.97 3.284a.75.75 0 01-1.286 0l-1.97-3.284a1.75 1.75 0 00-.27-.915V11c0-1.296-.484-2.78-1.454-3.75L6.75 4.624m16.971 0c-.829 0-1.637.329-2.223.914l-2.625 2.625c-.97.97-1.454 2.454-1.454 3.75v.001h-2.138v-.001a5.25 5.25 0 01-1.454-3.75l-2.625-2.625A3.141 3.141 0 016.75 4.624m16.971 0H6.75m0 0a3.14 3.14 0 00-2.223.914L1.902 8.164a5.25 5.25 0 00-1.454 3.75V12a.75.75 0 00.75.75h2.138V21h1.5V13.5h.75" /></svg>}
                    color="purple"
                    gradient="from-purple-600 to-fuchsia-600"
                    details={[
                        { label: 'نشط', value: stats?.stores?.approved, color: 'green' },
                        { label: 'قيد الانتظار', value: stats?.stores?.pending, color: 'orange' },
                    ]}
                />

                {/* Products Card */}
                <StatCard
                    title="المنتجات والفئات"
                    total={stats?.products?.total || 0}
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    color="emerald"
                    gradient="from-emerald-500 to-teal-600"
                    details={[
                        { label: 'منتجات نشطة', value: stats?.products?.active, color: 'emerald' },
                        { label: 'فئات', value: stats?.categories?.total, color: 'cyan' },
                    ]}
                />

                {/* Orders Card */}
                <StatCard
                    title="الطلبات"
                    total={stats?.orders?.total || 0}
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                    color="orange"
                    gradient="from-orange-500 to-red-500"
                    details={[
                        { label: 'مكتملة', value: stats?.orders?.completed, color: 'green' },
                        { label: 'قيد المعالجة', value: stats?.orders?.processing, color: 'blue' },
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">النشاط الأخير للسيستم</h2>
                            <p className="text-gray-500 text-sm mt-1">سجل كامل بآخر العمليات التي تمت على المنصة</p>
                        </div>
                        <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition text-sm font-bold">
                            عرض الكل
                        </button>
                    </div>

                    <div className="space-y-2">
                        {activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <ActivityItem key={index} activity={activity} />
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400">لا يوجد نشاطات لعرضها</div>
                        )}
                    </div>
                </div>

                {/* Quick Access / Promo */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2">تطبيق المتاجر</h3>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">يمكنك الآن إدارة المتاجر ومتابعة الطلبات من خلال تطبيق الجوال الخاص بالمشرفين.</p>
                            <button className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg">
                                تحميل التطبيق
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">روابط سريعة</h3>
                        <div className="space-y-3">
                            <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer group">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <span className="font-medium text-gray-600 group-hover:text-gray-900">إعدادات النظام</span>
                            </Link>
                            <Link href="/dashboard/admins" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer group">
                                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </div>
                                <span className="font-medium text-gray-600 group-hover:text-gray-900">إضافة مشرف</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
