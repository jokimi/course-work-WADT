import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import '../styles/FloatingLabels.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

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
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка входа');
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
                    <h2>Вход в аккаунт</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
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

                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </button>
                    </form>

                    <div className="auth-links auth-links-in-form">
                        <p>
                            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;