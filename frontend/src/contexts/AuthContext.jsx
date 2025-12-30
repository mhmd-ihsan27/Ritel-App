import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
         
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authAPI.login(username, password);

            if (response.success) {
                const userData = response.user || response.data?.user;

                setUser(userData);
                // Token is already stored by authAPI.login in web mode
                localStorage.setItem('user', JSON.stringify(userData));

                return { success: true, user: userData };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Terjadi kesalahan saat login. Silakan coba lagi.'
            };
        }
    };

    const logout = () => {
        setUser(null);
        authAPI.logout(); // This clears localStorage and token
    };

    const isAdmin = () => {
        return user && user.role === 'admin';
    };

    const isStaff = () => {
        return user && user.role === 'staff';
    };

    const hasPermission = (permission) => {
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        // Staff permissions
        const staffPermissions = [
            'view-products',
            'manage-products',
            'create-transaction',
            'view-own-transactions',
            'manage-customers',
            'view-own-reports',
            'update-stock',
            'manage-categories',
            'manage-promos'
        ];

        // Staff cannot access these
        const adminOnlyPermissions = [
            'view-all-transactions',
            'view-all-reports',
            'view-sales-reports',
            'manage-users',
            'view-staff-reports',
            'manage-settings'
        ];

        if (user.role === 'staff') {
            if (adminOnlyPermissions.includes(permission)) {
                return false;
            }
            return staffPermissions.includes(permission);
        }

        return false;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAdmin,
        isStaff,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
