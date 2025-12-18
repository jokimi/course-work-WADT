import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { currentUser, loading } = useAuth();

    console.log('ProtectedRoute - loading:', loading, 'currentUser:', currentUser);

    // Показываем загрузку пока проверяется авторизация
    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (!currentUser) {
        console.log('ProtectedRoute - redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && currentUser.role !== 'admin') {
        console.log('ProtectedRoute - redirecting to home, user is not admin');
        return <Navigate to="/" replace />;
    }

    console.log('ProtectedRoute - allowing access');
    return children;
};

export default ProtectedRoute;