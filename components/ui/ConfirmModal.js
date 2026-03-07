import { useEffect, useState } from 'react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    variant = 'danger', // danger, warning, info
    loading = false
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !mounted) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={!loading ? onClose : undefined}
            />

            {/* Modal Container */}
            <div
                className={`bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden transform transition-all duration-300 relative ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
                    }`}
                onClick={e => e.stopPropagation()}
                dir="rtl"
            >
                {/* Visual Top Bar */}
                <div className={`h-2 w-full ${variant === 'danger' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                    }`} />

                <div className="p-8">
                    {/* Icon section */}
                    <div className="flex justify-center mb-6">
                        <div className={`flex items-center justify-center h-20 w-20 rounded-3xl rotate-12 transition-transform hover:rotate-0 duration-500 ${variant === 'danger' ? 'bg-red-50' : 'bg-blue-50'
                            }`}>
                            <div className={`flex items-center justify-center h-16 w-16 rounded-2xl -rotate-12 transition-transform duration-500 ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {variant === 'danger' ? (
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                ) : (
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            type="button"
                            disabled={loading}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${variant === 'danger'
                                    ? 'bg-gray-900 hover:bg-black shadow-gray-200'
                                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                                }`}
                            onClick={onConfirm}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
