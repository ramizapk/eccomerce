'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (token) {
                const response = await api.getProfile();
                if (response.success && response.data.role === 'super_admin') {
                    setUser(response.data);
                } else {
                    localStorage.removeItem('admin_token');
                }
            }
        } catch (error) {
            localStorage.removeItem('admin_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.login({ email, password });
            if (response.success && response.data.user.role === 'super_admin') {
                localStorage.setItem('admin_token', response.data.token);
                setUser(response.data.user);
                router.push('/dashboard');
                return { success: true };
            } else {
                return { success: false, message: 'Access denied. Admin privileges required.' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('admin_token');
            setUser(null);
            router.push('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
