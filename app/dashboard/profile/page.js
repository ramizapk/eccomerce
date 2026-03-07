'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Only update name for now as per controller logic
            await api.updateProfile({ name: formData.name });
            toast.success('تم تحديث الملف الشخصي بنجاح');
            if (checkAuth) checkAuth(); // Refresh user data in context
        } catch (error) {
            toast.error(error.message || 'حدث خطأ أثناء التحديث');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.new_password.length < 8) {
            return toast.error('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
        }

        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            return toast.error('كلمة المرور الجديدة غير متطابقة');
        }
        setLoading(true);
        try {
            await api.changePassword(passwordData);
            toast.success('تم تغيير كلمة المرور بنجاح');
            setPasswordData({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
        } catch (error) {
            toast.error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 font-cairo pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">الملف الشخصي</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">إدارة معلوماتك الشخصية وإعدادات الأمان</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Personal Info Section */}
                <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">المعلومات الأساسية</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">اسمك وتفاصيل التواصل</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">الاسم الكامل</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none font-bold text-gray-900"
                                    placeholder="أدخل اسمك الكامل"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-100 border-gray-200 border text-gray-500 cursor-not-allowed font-bold"
                                    placeholder="email@example.com"
                                />
                                <p className="text-[10px] text-gray-400 font-medium pr-1">* لا يمكن تغيير البريد الإلكتروني حالياً</p>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-50 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black shadow-lg shadow-gray-200 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-3 disabled:opacity-50"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                                حفظ التعديلات
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Section */}
                <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">تغيير كلمة المرور</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">حافظ على أمان حسابك بكلمة مرور قوية</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">كلمة المرور الحالية</label>
                                <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all outline-none font-bold text-gray-900"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">كلمة المرور الجديدة</label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all outline-none font-bold text-gray-900"
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">تأكيد كلمة المرور الجديدة</label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password_confirmation}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all outline-none font-bold text-gray-900"
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-50 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black shadow-lg shadow-amber-100 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-3 disabled:opacity-50"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                                تحديث كلمة المرور
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
