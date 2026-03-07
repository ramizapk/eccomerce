'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLayout } from '@/contexts/LayoutContext';

export default function SettingsPage() {
    const { sidebarOpen } = useLayout();
    const [groupedSettings, setGroupedSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.getSettings();

            // Debugging the response structure
            console.log('Settings API Response:', response);

            // Important: api.js usually returns the whole response object { success, data, ... }
            // If the controller returns success($settings), then response.data is the object grouped by group name.
            const rawData = response?.data || {};

            // Safety check: if rawData is an array (not expected here but for safety)
            let processedData = {};
            if (Array.isArray(rawData)) {
                processedData = { general: rawData };
            } else if (typeof rawData === 'object') {
                processedData = rawData;
            }

            setGroupedSettings(processedData);

            const initialData = {};
            // Safely iterate over groups
            Object.entries(processedData).forEach(([group, items]) => {
                if (Array.isArray(items)) {
                    items.forEach(setting => {
                        if (setting && setting.key) {
                            initialData[setting.key] = setting.value;
                        }
                    });
                }
            });
            setFormData(initialData);
        } catch (error) {
            console.error('Error loading settings:', error);
            // toast.error('حدث خطأ أثناء تحميل الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const settingsArray = Object.entries(formData).map(([key, value]) => ({ key, value }));
            await api.updateSettings(settingsArray);
            toast.success('تم حفظ الإعدادات بنجاح');
            loadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const getGroupLabel = (group) => {
        const labels = {
            general: 'الإعدادات العامة',
            appearance: 'إعدادات المظهر',
            payment: 'بوابات الدفع',
            shipping: 'إعدادات الشحن',
            notifications: 'الإشعارات',
            social: 'روابط التواصل',
        };
        return labels[group] || group.charAt(0).toUpperCase() + group.slice(1);
    };

    const getFieldLabel = (key) => {
        const labels = {
            // General
            site_name: 'اسم الموقع',
            site_description: 'وصف الموقع',
            contact_email: 'البريد الإلكتروني',
            contact_phone: 'رقم الهاتف',
            contact: 'معلومات التواصل',
            Contact: 'معلومات التواصل',
            contact_info: 'معلومات التواصل',
            contact_us: 'اتصل بنا',
            email: 'البريد الإلكتروني',
            phone: 'رقم الهاتف',
            address: 'العنوان',
            currency: 'العملة',
            site_currency: 'عملة الموقع',
            tax_percentage: 'نسبة الضريبة',
            tax_percent: 'نسبة الضريبة',
            tax: 'الضريبة',
            maintenance_mode: 'وضع الصيانة',

            // Appearance
            site_logo: 'شعار الموقع',
            site_favicon: 'أيقونة الموقع',
            primary_color: 'اللون الأساسي',
            secondary_color: 'اللون الثانوي',

            // Payment
            paypal_client_id: 'معرف PayPal',
            paypal_secret: 'سر PayPal',
            paypal_mode: 'وضع PayPal',
            stripe_key: 'مفتاح Stripe',
            stripe_secret: 'سر Stripe',

            // Shipping
            shipping_cost: 'تكلفة الشحن',
            delivery_price: 'سعر التوصيل',
            delivery_cost: 'تكلفة التوصيل',
            free_shipping_threshold: 'حد الشحن المجاني',

            // Social
            facebook_url: 'رابط فيسبوك',
            twitter_url: 'رابط تويتر',
            instagram_url: 'رابط انستجرام',
            linkedin_url: 'رابط لينكد إن',
            youtube_url: 'رابط يوتيوب',

            // Notifications
            smtp_host: 'مضيف SMTP',
            smtp_port: 'منفذ SMTP',
            smtp_username: 'اسم مستخدم SMTP',
            smtp_password: 'كلمة مرور SMTP',
        };
        return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center font-cairo">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-400 text-lg font-medium">جاري تحميل الإعدادات...</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-cairo pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">إعدادات النظام</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">إدارة كافة إعدادات المنصة من مكان واحد</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {Object.entries(groupedSettings).length > 0 ? (
                    Object.entries(groupedSettings).map(([group, settings]) => (
                        <div key={group} className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 rounded-full bg-gray-900"></div>
                                    <h2 className="text-xl font-black text-gray-800">{getGroupLabel(group)}</h2>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase bg-white px-3 py-1 rounded-full border border-gray-100 tracking-wider">
                                    {Array.isArray(settings) ? settings.length : 0} إعداد
                                </span>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Array.isArray(settings) && settings.map((setting) => (
                                    <div key={setting.key} className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">
                                            {getFieldLabel(setting.key)}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData[setting.key] || ''}
                                            onChange={(e) => setFormData({ ...formData, [setting.key]: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all outline-none font-medium text-gray-900 placeholder-gray-300 shadow-sm"
                                            placeholder={`أدخل ${getFieldLabel(setting.key)}`}
                                        />
                                        {setting.description && (
                                            <p className="text-[11px] text-gray-400 font-medium leading-relaxed pr-1">{setting.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد إعدادات لعرضها</h3>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm">لم نتمكن من العثور على أي إعدادات مخزنة في قاعدة البيانات حالياً.</p>
                    </div>
                )}

                {/* Fixed Bottom Save Bar Container */}
                <div className={`fixed bottom-8 left-0 right-0 z-40 px-4 md:px-8 transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : 'lg:mr-20'}`}>
                    <div className="max-w-5xl mx-auto bg-gray-900/95 backdrop-blur-xl p-4 pr-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-between animate-fade-in-up">
                        <div className="hidden md:flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-white text-sm font-bold">تأكد من مراجعة القيم قبل الحفظ</span>
                        </div>
                        <button
                            type="submit"
                            disabled={saving || Object.keys(groupedSettings).length === 0}
                            className="w-full md:w-auto px-10 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl font-black shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                    <span>جاري الحفظ...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    <span>حفظ كافة التغييرات</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
