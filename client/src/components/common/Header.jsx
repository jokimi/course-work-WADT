import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Header.css';

// Импортируем логотип - файл должен быть в client/src/assets или client/public/img
// Если файл в public/img, используем process.env.PUBLIC_URL
const logoPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/img/purepawsome.jpg` : '/img/purepawsome.jpg';

const Header = () => {
    const { currentUser, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [logoError, setLogoError] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    console.log('Header - currentUser:', currentUser, 'loading:', loading);

    const displayNickname = currentUser?.username
        ? `${currentUser.username}`
        : (currentUser?.name || 'Пользователь');

    const userInitial = (currentUser?.username || currentUser?.name || 'U')
        .charAt(0)
        .toUpperCase();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header className="header">
            <div className="container">
                <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                    {logoError ? (
                        <h1>Pure Paw-some!</h1>
                    ) : (
                        <img 
                            src={logoPath}
                            alt="Pure Paw-some!" 
                            className="logo-image"
                            onError={() => setLogoError(true)}
                        />
                    )}
                </Link>

                <nav className="nav">
                    <Link to="/pet-types" className="nav-link">Каталог</Link>
                    <Link to="/articles" className="nav-link">Сообщество</Link>

                    {currentUser ? (
                        <>
                            {currentUser.role !== 'admin' && (
                                <Link to="/breed-request" className="nav-link">Заявка на породу</Link>
                            )}

                            <div 
                                className="user-menu"
                                onMouseEnter={() => setShowDropdown(true)}
                                onMouseLeave={() => setShowDropdown(false)}
                            >
                                <div className="user-link-trigger">
                                    {currentUser.avatar ? (
                                        <img 
                                            src={currentUser.avatar.startsWith('http') 
                                                ? currentUser.avatar 
                                                : `http://localhost:5000${currentUser.avatar}`} 
                                            alt={currentUser.username ? `@${currentUser.username}` : (currentUser.name || 'User')} 
                                            className="user-avatar" 
                                        />
                                    ) : (
                                        <div className="user-avatar-placeholder">
                                            {userInitial}
                                        </div>
                                    )}
                                    <span>{displayNickname}</span>
                                </div>
                                {showDropdown && (
                                    <div 
                                        className="user-dropdown"
                                        onMouseEnter={() => setShowDropdown(true)}
                                        onMouseLeave={() => setShowDropdown(false)}
                                    >
                                        <Link to="/profile" className="dropdown-item">
                                            Мой аккаунт
                                        </Link>
                                        {currentUser.role === 'admin' && (
                                            <Link to="/admin" className="dropdown-item">
                                                Панель управления
                                            </Link>
                                        )}
                                        <Link to="/my-pets" className="dropdown-item">
                                            Мои питомцы
                                        </Link>
                                        <Link to="/saved-articles" className="dropdown-item">
                                            Сохраненные статьи
                                        </Link>
                                        <Link to="/reminders" className="dropdown-item">
                                            Мои напоминания
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="dropdown-item logout-item">
                                            Выйти из аккаунта
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="nav-link">Войти</Link>
                            <Link to="/register" className="nav-link register-btn">Зарегистрироваться</Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;