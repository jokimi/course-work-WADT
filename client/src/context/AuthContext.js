import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Checking auth, token exists:', !!token);
            if (token) {
                console.log('Attempting to get current user...');
                const user = await authAPI.getCurrentUser();
                console.log('Current user received:', user);
                setCurrentUser(user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log('Attempting login...');
            const response = await authAPI.login(email, password);
            console.log('Login response:', response);
            localStorage.setItem('token', response.token);
            setCurrentUser(response.user);
            console.log('User set in context:', response.user);
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setCurrentUser(null);
        }
    };

    const updateUser = (userData) => {
        setCurrentUser(userData);
    };

    const value = {
        currentUser,
        login,
        register,
        logout,
        updateUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};