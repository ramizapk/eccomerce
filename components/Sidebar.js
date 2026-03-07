'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';

const menuItems = [
    {
        title: 'الرئيسية',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
        path: '/dashboard',
    },
    {
        title: 'الطلبات',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        ),
        path: '/dashboard/orders',
    },
    {
        title: 'المنتجات',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
        ),
        path: '/dashboard/products',
    },
    {
        title: 'مختاراتنا',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
        ),
        path: '/dashboard/curated-products',
    },
    {
        title: 'الفئات',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
        ),
        path: '/dashboard/categories',
    },
    {
        title: 'البراندات',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
        ),
        path: '/dashboard/brands',
    },
    {
        title: 'الخيارات',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
        ),
        path: '/dashboard/options',
    },
    {
        title: 'المتاجر',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h4.481M6.75 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m13.721-16.376l-2.625 2.625c-.97.97-1.454 2.454-1.454 3.75v1.125c0 .327-.109.645-.27.915l-1.97 3.284a.75.75 0 01-1.286 0l-1.97-3.284a1.75 1.75 0 00-.27-.915V11c0-1.296-.484-2.78-1.454-3.75L6.75 4.624m16.971 0c-.829 0-1.637.329-2.223.914l-2.625 2.625c-.97.97-1.454 2.454-1.454 3.75v.001h-2.138v-.001a5.25 5.25 0 01-1.454-3.75l-2.625-2.625A3.141 3.141 0 016.75 4.624m16.971 0H6.75m0 0a3.14 3.14 0 00-2.223.914L1.902 8.164a5.25 5.25 0 00-1.454 3.75V12a.75.75 0 00.75.75h2.138V21h1.5V13.5h.75" />
            </svg>
        ),
        path: '/dashboard/stores',
    },
    {
        title: 'العملاء',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
        ),
        path: '/dashboard/customers',
    },
    {
        title: 'المسؤولين',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        path: '/dashboard/admins',
    },
    {
        title: 'الإعدادات',
        icon: (active) => (
            <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        path: '/dashboard/settings',
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { sidebarOpen, setSidebarOpen } = useLayout();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar Container */}
            <div className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-100 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72 translate-x-0' : 'w-20 translate-x-full lg:translate-x-0'}`}>

                {/* Header / Logo */}
                <div className={`p-6 flex items-center gap-3 mb-2 h-24 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}>
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-primary-200 rounded-xl blur opacity-40"></div>
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg relative z-10">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h4.481M6.75 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m13.721-16.376l-2.625 2.625c-.97.97-1.454 2.454-1.454 3.75v1.125c0 .327-.109.645-.27.915l-1.97 3.284a.75.75 0 01-1.286 0l-1.97-3.284a1.75 1.75 0 00-.27-.915V11c0-1.296-.484-2.78-1.454-3.75L6.75 4.624m16.971 0c-.829 0-1.637.329-2.223.914l-2.625 2.625c-.97.97-1.454 2.454-1.454 3.75v.001h-2.138v-.001a5.25 5.25 0 01-1.454-3.75l-2.625-2.625A3.141 3.141 0 016.75 4.624m16.971 0H6.75m0 0a3.14 3.14 0 00-2.223.914L1.902 8.164a5.25 5.25 0 00-1.454 3.75V12a.75.75 0 00.75.75h2.138V21h1.5V13.5h.75" />
                            </svg>
                        </div>
                    </div>

                    <div className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'}`}>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight">E-Commerce</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Dashboard</p>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    } ${!sidebarOpen && 'justify-center'}`}
                                title={!sidebarOpen ? item.title : ''}
                            >
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-600 rounded-l-full"></div>
                                )}
                                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon(isActive)}
                                </div>
                                <span className={`font-bold text-sm tracking-wide whitespace-nowrap transition-all duration-200 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 hidden'
                                    }`}>
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
