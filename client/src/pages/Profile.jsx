import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, petsAPI } from '../services/api';
import PetCard from '../components/pets/PetCard';
import '../styles/Profile.css';
import '../styles/MyPets.css';
import '../styles/PetTypes.css';
import '../styles/FloatingLabels.css';
import crownIcon from '../styles/icons/crown.png';

const Profile = () => {
    const { currentUser, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        telegramChatId: '',
        gender: '',
        weightUnit: 'kg_and_g'
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [pets, setPets] = useState([]);
    const [petsLoading, setPetsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                username: currentUser.username || '',
                name: currentUser.name || '',
                email: currentUser.email || '',
                telegramChatId: currentUser.telegram_chat_id || '',
                gender: currentUser.gender || '',
                weightUnit: currentUser.weight_unit || 'kg_and_g'
            });
            setAvatarPreview(currentUser.avatar ? `http://localhost:5000${currentUser.avatar}` : null);
        }
    }, [currentUser]);

    // Инициализация классов has-value для полей с начальными значениями
    useEffect(() => {
        const formGroups = document.querySelectorAll('.floating-label-group');
        formGroups.forEach(group => {
            const input = group.querySelector('input, textarea, select');
            if (input) {
                if (input.tagName === 'SELECT') {
                    if (input.value && input.value.trim() !== '') {
                        group.classList.add('has-value');
                        input.classList.add('filter-selected');
                    }
                } else if (input.value && input.value.trim() !== '') {
                    group.classList.add('has-value');
                }
            }
        });
    }, [formData, editing]);

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            const data = await petsAPI.getMyPets();
            setPets(data);
        } catch (error) {
            console.error('Ошибка при загрузке питомцев:', error);
        } finally {
            setPetsLoading(false);
        }
    };

    const handleEdit = () => {
        setEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setEditing(false);
        setAvatarFile(null);
        setAvatarPreview(currentUser?.avatar ? `http://localhost:5000${currentUser.avatar}` : null);
        if (currentUser) {
            setFormData({
                username: currentUser.username || '',
                name: currentUser.name || '',
                email: currentUser.email || '',
                telegramChatId: currentUser.telegram_chat_id || '',
                gender: currentUser.gender || '',
                weightUnit: currentUser.weight_unit || 'kg_and_g'
            });
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result);
                };
                reader.readAsDataURL(file);
                
                // Создаем FormData для загрузки файла
                const formDataToSend = new FormData();
                formDataToSend.append('avatar', file);
                formDataToSend.append('username', currentUser.username);
                formDataToSend.append('name', currentUser.name);
                formDataToSend.append('email', currentUser.email);
                formDataToSend.append('telegramChatId', currentUser.telegram_chat_id || '');
                formDataToSend.append('gender', currentUser.gender || '');
                formDataToSend.append('weightUnit', currentUser.weight_unit || 'kg_and_g');
                
                // Обновляем пользователя с новым аватаром
                userAPI.updateUser(formDataToSend).then(updatedUser => {
                    updateUser(updatedUser);
                    setAvatarFile(null);
                    setSuccess('Аватар успешно обновлен');
                }).catch(error => {
                    setError('Ошибка при загрузке фото: ' + (error.response?.data?.message || error.message));
                });
                
                // Очищаем input
                e.target.value = '';
            } catch (error) {
                console.error('Avatar upload error:', error);
                setError('Ошибка при загрузке фото: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Добавляем/удаляем класс has-value для floating labels
        const input = e.target;
        const formGroup = input.closest('.floating-label-group');
        if (formGroup) {
            if (value && value.trim() !== '') {
                formGroup.classList.add('has-value');
            } else {
                formGroup.classList.remove('has-value');
            }
        }
        
        // Для селектов также обновляем класс
        if (e.target.tagName === 'SELECT') {
            if (value && value.trim() !== '') {
                e.target.classList.add('filter-selected');
            } else {
                e.target.classList.remove('filter-selected', 'filter-selected-photo');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('username', formData.username);
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            // Всегда отправляем telegramChatId, даже если пустой (для возможности удаления)
            formDataToSend.append('telegramChatId', formData.telegramChatId || '');
            formDataToSend.append('gender', formData.gender || '');
            formDataToSend.append('weightUnit', formData.weightUnit || 'kg_and_g');
            
            if (avatarFile) {
                formDataToSend.append('avatar', avatarFile);
            }

            const updatedUser = await userAPI.updateUser(formDataToSend);
            updateUser(updatedUser);
            setAvatarFile(null);
            setEditing(false);
            setSuccess('Профиль успешно обновлен');
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при обновлении профиля');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError('');
        setPasswordSuccess('');

        // Валидация на клиенте
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Новый пароль и подтверждение не совпадают');
            setPasswordLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Пароль должен содержать минимум 6 символов');
            setPasswordLoading(false);
            return;
        }

        try {
            await userAPI.updatePassword(passwordData);
            setPasswordSuccess('Пароль успешно изменен');
            setTimeout(() => {
                setShowPasswordForm(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
                setPasswordSuccess('');
            }, 2000);
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Ошибка при изменении пароля');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!currentUser) return <div className="loading">Загрузка профиля...</div>;

    const profileAvatarSrc = currentUser.avatar
        ? (currentUser.avatar.startsWith('http')
            ? currentUser.avatar
            : `http://localhost:5000${currentUser.avatar}`)
        : null;

    const profileAvatarAlt = currentUser.username
        ? `@${currentUser.username}`
        : (currentUser.name || 'Пользователь');

    const profileAvatarPlaceholder = (currentUser.username || currentUser.name || 'U')
        .charAt(0)
        .toUpperCase();

    return (
        <div className="profile">
            <div className="container">
                <div className="page-header">
                    <h1>Мой аккаунт</h1>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="profile-content">
                    <div className="profile-summary">
                        <div className="profile-avatar-wrapper">
                            <div className={`profile-avatar ${currentUser.role === 'admin' ? 'profile-avatar--admin' : ''}`}>
                                <div className="profile-avatar-media">
                                    {profileAvatarSrc ? (
                                        <img src={profileAvatarSrc} alt={profileAvatarAlt} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {profileAvatarPlaceholder}
                                        </div>
                                    )}
                                </div>
                                {currentUser.role === 'admin' && (
                                    <div className="avatar-admin-badge">
                                        <img src={crownIcon} alt="Admin crown" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="profile-identity">
                            <h2>{currentUser.name || currentUser.username || 'Пользователь'}</h2>
                            <p className="username">@{currentUser.username || 'username'}</p>
                            <p className="email">{currentUser.email || 'email@example.com'}</p>
                        </div>
                        {!editing && (
                            <div className="profile-actions">
                                <button onClick={() => setEditing(true)} className="btn btn-outline">
                                    Редактировать профиль
                                </button>
                                <button onClick={() => setShowPasswordForm(!showPasswordForm)}
                                        className="btn btn-outline">
                                    Изменить пароль
                                </button>
                                {!editing && (
                                    <div className="avatar-change-section">
                                        <input
                                            type="file"
                                            id="avatar-upload-profile"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="avatar-upload-profile" className="btn btn-outline" style={{ padding: '10px 20px' }}>
                                            Изменить фото
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="profile-main">
                        {petsLoading ? (
                            <div className="loading">Загрузка питомцев...</div>
                        ) : pets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <img src={`${process.env.PUBLIC_URL || ''}/icons/paw-prints.png`} alt="Paw prints" style={{ width: '64px', height: '64px' }} />
                                </div>
                                <h3>У вас пока нет питомцев</h3>
                                <p>Добавьте первого питомца, чтобы начать отслеживать его здоровье и уход</p>
                                <Link to="/my-pets" className="btn btn-primary">
                                    Добавить первого питомца
                                </Link>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ marginBottom: '32px', textAlign: 'center' }}>Мои питомцы</h2>
                                <div className="pets-grid species-grid" style={{ marginTop: 0, border: 'none' }}>
                                    {pets.map((pet) => (
                                        <Link
                                            key={pet.id}
                                            to={`/pet/${pet.id}`}
                                            className="species-card" style={{ padding: 0 }}
                                        >
                                            <div 
                                                className="species-icon-circle"
                                                style={{
                                                    backgroundImage: pet.avatar 
                                                        ? `url(${pet.avatar.startsWith('http') ? pet.avatar : `http://localhost:5000${pet.avatar}`})`
                                                        : `url(${process.env.PUBLIC_URL || ''}/icons/paw-prints.png)`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundRepeat: 'no-repeat'
                                                }}
                                            >
                                            </div>
                                            <div className="species-name">{pet.petname}</div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {editing && (
                    <div className="profile-content" style={{ marginTop: '20px' }}>
                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="form-section" style={{ margin: 0 }}>
                                <h3 style={{ marginBottom: 10 }}>Редактирование профиля</h3>

                                <div className="profile-form-row" style={{ marginBottom: 10 }}>
                                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                        />
                                        <label htmlFor="username">Имя пользователя *</label>
                                    </div>

                                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                        />
                                        <label htmlFor="name">Полное имя *</label>
                                    </div>
                                </div>

                                <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="email">Email *</label>
                                </div>

                                <div className="profile-form-row" style={{ marginBottom: 10 }}>
                                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className={formData.gender ? 'filter-selected' : ''}
                                            style={{
                                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                                backgroundSize: '16px 16px',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 12px center'
                                            }}
                                        >
                                            <option value="">Выберите пол</option>
                                            <option value="Мужской">Мужской</option>
                                            <option value="Женский">Женский</option>
                                        </select>
                                        <label htmlFor="gender">Пол</label>
                                    </div>

                                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                        <select
                                            id="weightUnit"
                                            name="weightUnit"
                                            value={formData.weightUnit}
                                            onChange={handleChange}
                                            className={formData.weightUnit ? 'filter-selected' : ''}
                                            style={{
                                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                                backgroundSize: '16px 16px',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 12px center'
                                            }}
                                        >
                                            <option value="kg_and_g">Килограммы и граммы</option>
                                            <option value="kg">Килограммы</option>
                                            <option value="g">Граммы</option>
                                        </select>
                                        <label htmlFor="weightUnit">Единицы веса питомца</label>
                                    </div>
                                </div>

                                <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                    <input
                                        type="text"
                                        id="telegramChatId"
                                        name="telegramChatId"
                                        value={formData.telegramChatId}
                                        onChange={handleChange}
                                        placeholder=" "
                                    />
                                    <label htmlFor="telegramChatId">Telegram Chat ID</label>
                                    <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                        Для получения Chat ID напишите боту @userinfobot в Telegram
                                    </small>
                                </div>
                            </div>

                            <div className="form-actions" style={{ marginTop: 0 }}>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="btn btn-outline"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {showPasswordForm && !editing && (
                    <div className="profile-content" style={{ marginTop: '20px' }}>
                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <div className="form-section" style={{ marginBottom: 0 }}>
                                <h3 style={{ marginBottom: 10 }}>Изменение пароля</h3>

                                {passwordError && <div className="error-message">{passwordError}</div>}
                                {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                                <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                                    <input
                                        type="password"
                                        id="oldPassword"
                                        name="oldPassword"
                                        value={passwordData.oldPassword}
                                        onChange={(e) => {
                                            setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }));
                                            const formGroup = e.target.closest('.floating-label-group');
                                            if (formGroup) {
                                                if (e.target.value && e.target.value.trim() !== '') {
                                                    formGroup.classList.add('has-value');
                                                } else {
                                                    formGroup.classList.remove('has-value');
                                                }
                                            }
                                        }}
                                        required
                                        placeholder=" "
                                    />
                                    <label htmlFor="oldPassword">Текущий пароль *</label>
                                </div>

                                <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={(e) => {
                                            setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                                            const formGroup = e.target.closest('.floating-label-group');
                                            if (formGroup) {
                                                if (e.target.value && e.target.value.trim() !== '') {
                                                    formGroup.classList.add('has-value');
                                                } else {
                                                    formGroup.classList.remove('has-value');
                                                }
                                            }
                                        }}
                                        required
                                        minLength="6"
                                        placeholder=" "
                                    />
                                    <label htmlFor="newPassword">Новый пароль * (минимум 6 символов)</label>
                                </div>

                                <div className="form-group floating-label-group">
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => {
                                            setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                                            const formGroup = e.target.closest('.floating-label-group');
                                            if (formGroup) {
                                                if (e.target.value && e.target.value.trim() !== '') {
                                                    formGroup.classList.add('has-value');
                                                } else {
                                                    formGroup.classList.remove('has-value');
                                                }
                                            }
                                        }}
                                        required
                                        minLength="6"
                                        placeholder=" "
                                    />
                                    <label htmlFor="confirmPassword">Подтвердите новый пароль *</label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                    }}
                                    className="btn btn-outline"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? 'Сохранение...' : 'Изменить пароль'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;