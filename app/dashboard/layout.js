'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

function DashboardContent({ children }) {
    const { user, loading } = useAuth();
    const { sidebarOpen } = useLayout();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            <Sidebar />

            <main className={`transition-all duration-300 ease-in-out min-h-screen flex flex-col ${sidebarOpen ? 'lg:mr-72' : 'lg:mr-20'}`}>
                <TopBar />
                <div className="flex-1 p-6 lg:p-10 max-w-[1920px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <LayoutProvider>
            <DashboardContent>{children}</DashboardContent>
        </LayoutProvider>
    );
}
