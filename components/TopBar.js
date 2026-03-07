'use client';

import { useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function TopBar() {
    const { toggleSidebar, sidebarOpen } = useLayout();
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${sidebarOpen ? 'lg:mr-0' : 'lg:mr-0'}`}>
            <div className="flex items-center justify-between px-3 md:px-6 py-4 font-cairo">
                {/* Right Side: Toggle & Search (RTL Start) */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleSidebar}
                        className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Search Bar */}
                    <div className="hidden  md:flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-primary-200 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all w-64 lg:w-96">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="بحث في لوحة التحكم..."
                            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400 font-medium"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">⌘K</span>
                        </div>
                    </div>
                </div>

                {/* Left Side: Actions & Profile (RTL End) */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors group">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                    </button>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-200"></div>

                    {/* User Profile & Dropdown */}
                    <div className="relative">
                        <div
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-2 rounded-xl transition-all border border-transparent hover:border-gray-100"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                                {user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-500 font-medium leading-none">سوبر أدمن</p>
                            </div>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-fade-in origin-top-left">
                                    <Link
                                        href="/dashboard/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        الملف الشخصي
                                    </Link>
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        الإعدادات
                                    </Link>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        تسجيل الخروج
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
