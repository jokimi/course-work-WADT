import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import '../styles/FloatingLabels.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        
        // Добавляем/удаляем класс has-value для floating labels
        const input = e.target;
        const formGroup = input.closest('.floating-label-group');
        if (formGroup) {
            if (e.target.value && e.target.value.trim() !== '') {
                formGroup.classList.add('has-value');
            } else {
                formGroup.classList.remove('has-value');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);

        try {
            await register({
                username: formData.username,
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            navigate('/login');
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    const backgroundImages = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <div className="auth-page-container">
            <div className="auth-collage">
                <div className="collage-wrapper">
                    {[...backgroundImages, ...backgroundImages].map((num, index) => (
                        <div key={index} className="collage-item">
                            <img 
                                src={`${process.env.PUBLIC_URL || ''}/background/${num}.jpg`}
                                alt={`Background ${num}`}
                                onError={(e) => {
                                    e.target.src = `${process.env.PUBLIC_URL || ''}/img/background/${num}.jpg`;
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="auth-form-container">
                <div className="auth-card">
                    <h2>Регистрация</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group floating-label-group">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder=" "
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="username">Имя пользователя</label>
                        </div>

                        <div className="form-group floating-label-group">
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder=" "
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="name">Полное имя</label>
                        </div>

                        <div className="form-group floating-label-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder=" "
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="email">Email</label>
                        </div>

                        <div className="form-group floating-label-group">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder=" "
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="password">Пароль</label>
                        </div>

                        <div className="form-group floating-label-group">
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder=" "
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="confirmPassword">Подтвердите пароль</label>
                        </div>

                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                        >
                            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    <div className="auth-links auth-links-in-form">
                        <p>
                            Уже есть аккаунт? <Link to="/login">Войти</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;