'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsMobile(true);
                setSidebarOpen(false);
            } else {
                setIsMobile(false);
                setSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar, isMobile }}>
            {children}
        </LayoutContext.Provider>
    );
}

export const useLayout = () => useContext(LayoutContext);
