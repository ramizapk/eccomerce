'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Cairo } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic', 'latin'] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex font-cairo bg-white overflow-hidden ${cairo.className}`} dir="rtl">

      {/* Visual Section (Right Side) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0f111a] text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gray-800/20 via-[#0f111a] to-[#0f111a]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>

        {/* Header/Logo Area */}
        <div className="relative z-10 w-full flex justify-center mt-12">
          <div className="flex items-center gap-3">
            <span className="font-black text-3xl tracking-wide text-white">SALASAH</span>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center text-center mt-8">
          <h1 className="text-5xl font-black leading-tight mb-6">
            مرحباً بك في <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              لوحة التحكم
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md font-medium leading-relaxed">
            تحكم كامل في متجرك، منتجاتك، وعملائك من خلال لوحة تحكم واحدة ذكيّة وعصريّة.
          </p>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 flex flex-col items-center gap-5 mb-12">
          <div className="flex -space-x-4 space-x-reverse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0f111a] bg-gray-800 flex items-center justify-center overflow-hidden relative shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${i === 1 ? 'from-purple-500 to-indigo-600' :
                  i === 2 ? 'from-blue-500 to-cyan-500' :
                    i === 3 ? 'from-pink-500 to-rose-500' :
                      'from-emerald-500 to-teal-500'
                  }`}></div>
                <span className="relative text-xs font-bold text-white/50">U{i}</span>
              </div>
            ))}
          </div>
          <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <p className="text-sm text-gray-300 font-bold">أكثر من 50 ألف متسوق نشط</p>
          </div>
        </div>
      </div>

      {/* Login Form Section (Left Side) */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative">


        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 -mt-10">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 mb-3">تسجيل الدخول</h2>
              <p className="text-gray-500 font-bold">
                يرجى إدخال بيانات الدخول للمتابعة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-400 mr-1">البريد الإلكتروني</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl text-gray-900 font-bold placeholder-gray-400 focus:outline-none transition-all text-left dir-ltr"
                    placeholder="store@eccomerce.com"
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-sm font-black text-gray-400">كلمة المرور</label>
                  <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-800">نسيت كلمة المرور؟</a>
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl text-gray-900 font-bold placeholder-gray-400 focus:outline-none transition-all text-left dir-ltr"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#0f111a] hover:bg-black text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-200 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>تسجيل الدخول</span>
                )}
              </button>
            </form>

            <div className="mt-10 flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold bg-gray-50 py-3 rounded-xl border border-gray-100">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span>نقوم بتشفير بياناتك لضمان أعلى مستويات الأمان والخصوصية.</span>
            </div>

            {/* Quick Login Hint */}
            <div className="mt-6 text-center">
              <p className="text-[10px] text-gray-300">
                admin@eccomerce.com / password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
