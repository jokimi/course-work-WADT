import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { petsAPI } from '../services/api';
import PetForm from '../components/pets/PetForm';
import DailyLogForm from '../components/pets/DailyLogForm';
import PetStatsChart from '../components/pets/PetStatsChart';
import '../styles/PetDetailsPage.css';
import '../styles/BreedCard.css';

const PetDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [showEditForm, setShowEditForm] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [logs, setLogs] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [editingDate, setEditingDate] = useState(null);
    const [dateValue, setDateValue] = useState('');
    const [reminderTypes, setReminderTypes] = useState([]);

    useEffect(() => {
        fetchPet();
        fetchReminderTypes();
        if (id) {
            fetchLogs();
        }
    }, [id]);

    const fetchPet = async () => {
        try {
            const data = await petsAPI.getPetById(id);
            setPet(data);
        } catch (error) {
            setError('Ошибка при загрузке информации о питомце');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const data = await petsAPI.getPetLogs(id);
            setLogs(data);
        } catch (error) {
            console.error('Ошибка при загрузке записей:', error);
        }
    };

    const fetchReminderTypes = async () => {
        try {
            const data = await petsAPI.getReminderTypes();
            setReminderTypes(data);
        } catch (error) {
            console.error('Ошибка при загрузке типов напоминаний:', error);
        }
    };

    const handleAddLog = () => {
        setEditingLog(null);
        setShowLogForm(true);
    };

    const handleEditLog = (log) => {
        setEditingLog(log);
        setShowLogForm(true);
    };

    const handleDeleteLog = async (logId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
            try {
                await petsAPI.deletePetLog(id, logId);
                await fetchLogs();
            } catch (error) {
                setError('Ошибка при удалении записи');
            }
        }
    };

    const handleLogSuccess = () => {
        fetchLogs();
        setShowLogForm(false);
        setEditingLog(null);
    };

    const getAge = (birthday) => {
        const birthDate = new Date(birthday);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        return `${years} лет, ${months} месяцев`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getSizeTranslation = (size) => {
        const sizeMap = {
            'small': 'Маленький',
            'medium': 'Средний',
            'large': 'Крупный'
        };
        return sizeMap[size] || size;
    };

    const renderTrainability = (level) => {
        const paws = [];
        const maxLevel = 5;
        const filledLevel = Math.min(level || 0, maxLevel);
        const pawIconPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/paw.svg` : '/icons/paw.svg';
        
        for (let i = 1; i <= maxLevel; i++) {
            paws.push(
                <span 
                    key={i} 
                    className={`paw ${i <= filledLevel ? 'filled' : ''}`}
                >
                    <img src={pawIconPath} alt="paw" className="paw-icon" />
                </span>
            );
        }
        return paws;
    };

    const renderMoodPaws = (moodLevel) => {
        const paws = [];
        const maxLevel = 5;
        const filledLevel = Math.min(moodLevel || 0, maxLevel);
        const pawIconPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/paw.svg` : '/icons/paw.svg';
        
        for (let i = 1; i <= maxLevel; i++) {
            paws.push(
                <span 
                    key={i} 
                    className={`paw ${i <= filledLevel ? 'filled' : ''}`}
                >
                    <img src={pawIconPath} alt="paw" className="paw-icon" />
                </span>
            );
        }
        return <div className="trainability">{paws}</div>;
    };

    const handleEditPet = () => {
        setShowEditForm(true);
    };

    const handleDeletePet = async () => {
        if (window.confirm('Вы уверены, что хотите удалить этого питомца?')) {
            try {
                await petsAPI.deletePet(id);
                navigate('/my-pets');
            } catch (error) {
                setError('Ошибка при удалении питомца');
            }
        }
    };

    const handleUpdatePet = async (petData) => {
        try {
            // Если есть файл аватара, создаем FormData
            let updateData = petData;
            if (petData.avatar instanceof File) {
                const formData = new FormData();
                Object.keys(petData).forEach(key => {
                    if (key === 'avatar' && petData[key] instanceof File) {
                        formData.append('avatar', petData[key]);
                    } else if (key !== 'avatar') {
                        formData.append(key, petData[key]);
                    }
                });
                updateData = formData;
            }
            
            const updatedPet = await petsAPI.updatePet(id, updateData);
            setPet(updatedPet);
            setShowEditForm(false);
        } catch (error) {
            console.error('Update error:', error);
            setError('Ошибка при обновлении питомца: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Создаем FormData для загрузки файла
                const formData = new FormData();
                formData.append('avatar', file);
                
                // Добавляем все необходимые поля для обновления
                formData.append('name', pet.petname);
                formData.append('birthday', pet.birthday.split('T')[0]);
                formData.append('gender', pet.gender.toString());
                formData.append('currentWeight', pet.currentweight.toString());
                formData.append('breedId', pet.breedid.toString());
                formData.append('healthNotes', pet.healthnotes || '');
                
                // Обновляем питомца с новым аватаром
                const updatedPet = await petsAPI.updatePet(id, formData);
                setPet(updatedPet);
                setAvatarFile(null);
                
                // Очищаем input
                e.target.value = '';
            } catch (error) {
                console.error('Avatar upload error:', error);
                setError('Ошибка при загрузке фото: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            await petsAPI.updatePet(id, { avatar: null });
            setPet(prev => ({ ...prev, avatar: null }));
        } catch (error) {
            setError('Ошибка при удалении аватара');
        }
    };

    // Маппинг типов напоминаний к полям дневника (pet_logs) — по ключевым словам,
    // чтобы не зависеть от точного текста rtname в БД.
    const getReminderTypeFieldMapping = (reminderTypeName) => {
        const name = (reminderTypeName || '').toLowerCase();
        if (!name) return null;

        if (name.includes('вакцин')) {
            return { petField: 'lastvaccinated', logField: 'vaccination' };
        }
        if (name.includes('осмотр')) {
            return { petField: 'lastinspected', logField: 'vet_inspection' };
        }
        if (name.includes('паразит')) {
            return { petField: 'lastparasitetreatment', logField: 'parasite_treatment' };
        }
        if (name.includes('витамин')) {
            return { petField: 'lastvitamins', logField: 'vitamins' };
        }
        if (name.includes('лекар')) {
            return { petField: 'lastmedication', logField: 'medication' };
        }
        if (name.includes('купани')) {
            return { petField: 'lastbathing', logField: 'bathing' };
        }
        if (name.includes('грум') || name.includes('стрижка шерсти')) {
            return { petField: 'lastgrooming', logField: 'grooming' };
        }
        if (name.includes('зуб')) {
            return { petField: 'lastteethcleaning', logField: 'teeth_cleaning' };
        }
        if (name.includes('ког') || name.includes('стрижка когтей')) {
            return { petField: 'lastnailtrimming', logField: 'nail_trimming' };
        }

        return null;
    };

    const getPetFieldValue = (fieldName) => {
        if (!pet || !fieldName) return null;
        return pet[fieldName] || null;
    };

    // Последняя дата выполнения процедуры: ТОЛЬКО по дневнику
    const getLastProcedureDate = (mapping) => {
        if (!mapping) return null;
        const { petField, logField } = mapping;

        if (logField && logs && logs.length > 0) {
            const lastLog = logs
                .filter(log => log[logField])
                .sort((a, b) => new Date(b.logdate) - new Date(a.logdate))[0];
            if (lastLog) {
                return lastLog.logdate;
            }
            return null;
        }

        return null;
    };

    const handleEditDate = (dateType, currentValue) => {
        setEditingDate(dateType);
        setDateValue(currentValue ? currentValue.split('T')[0] : '');
    };

    const handleSaveDate = async () => {
        if (!editingDate) return;
        
        try {
            const updateData = {};
            // Преобразуем дату в формат ISO, если она указана
            updateData[editingDate] = dateValue ? new Date(dateValue).toISOString() : null;
            
            await petsAPI.updatePet(id, updateData);
            await fetchPet(); // Обновляем данные
            setEditingDate(null);
            setDateValue('');
        } catch (error) {
            setError('Ошибка при обновлении даты');
        }
    };

    const handleCancelEdit = () => {
        setEditingDate(null);
        setDateValue('');
    };

    const handleSetToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setDateValue(today);
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!pet) return <div className="error">Питомец не найден</div>;

    return (
        <div className="pet-details-page">
            <div className="container">
                <div className="breadcrumb">
                    <Link to="/my-pets">Мои питомцы</Link>
                    <span> / </span>
                    <span>{pet.petname}</span>
                </div>

                {error && (
                    <div className="error-message" style={{ 
                        background: '#f8d7da', 
                        color: '#721c24', 
                        padding: '10px', 
                        borderRadius: '5px', 
                        marginBottom: '20px' 
                    }}>
                        {error}
                    </div>
                )}

                <div className="pet-header-card">
                    <div className="pet-header" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                        <div className="pet-photo-section">
                            <div className="pet-avatar-large">
                                <div className="pet-avatar-media">
                                    {pet.avatar ? (
                                        <img src={pet.avatar} alt={pet.petname} />
                                    ) : (
                                        <div className="avatar-placeholder-large">
                                            <span>🐾</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pet-avatar-gender-badge">
                                    <img
                                        src={`${process.env.PUBLIC_URL || ''}/icons/${pet.gender ? 'male' : 'female'}.svg`}
                                        alt={pet.gender ? 'Самец' : 'Самка'}
                                    />
                                </div>
                            </div>
                            <div className="avatar-controls">
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="pet-main-info">
                            <h1 className="pet-title">{pet.petname}</h1>
                            <div className="pet-identity">
                                <p className="pet-breed-line">{pet.breed.breedname}</p>
                                <p className="pet-age-line">{getAge(pet.birthday)}</p>
                            </div>
                        </div>
                        <div className="pet-actions">
                            <button onClick={handleEditPet} className="btn btn-primary">
                                Редактировать
                            </button>
                            <button onClick={handleDeletePet} className="btn btn-primary">
                                Удалить
                            </button>
                            <Link to={`/reminders?pet=${pet.id}`} className="btn btn-primary">
                                Напоминания
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Основная информация
                    </button>
                    <button
                        className={`tab ${activeTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveTab('health')}
                    >
                        Здоровье и уход
                    </button>
                    <button
                        className={`tab ${activeTab === 'breed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('breed')}
                    >
                        Информация о породе
                    </button>
                    <button
                        className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        Дневник питомца
                    </button>
                    <button
                        className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Динамика показателей
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'info' && (
                        <div className="info-tab">
                            <div className="info-grid">
                                <div className="info-card breed-main-characteristics">
                                    <div className="characteristic-line">
                                        <span className="char-label">Кличка:</span>
                                        <span className="char-value">{pet.petname}</span>
                                    </div>
                                    <div className="characteristic-line">
                                        <span className="char-label">Порода:</span>
                                        <span className="char-value">{pet.breed.breedname}</span>
                                    </div>
                                    <div className="characteristic-line">
                                        <span className="char-label">Дата рождения:</span>
                                        <span className="char-value">{formatDate(pet.birthday)}</span>
                                    </div>
                                    <div className="characteristic-line">
                                        <span className="char-label">Возраст:</span>
                                        <span className="char-value">{getAge(pet.birthday)}</span>
                                    </div>
                                    <div className="characteristic-line">
                                        <span className="char-label">Пол:</span>
                                        <span className="char-value">{pet.gender ? 'Мужской' : 'Женский'}</span>
                                    </div>
                                    <div className="characteristic-line">
                                        <span className="char-label">Текущий вес:</span>
                                        <span className="char-value">
                                            {(() => {
                                                // Находим последнюю запись с весом
                                                const lastWeightLog = logs
                                                    .filter(log => log.weight !== null && log.weight !== undefined)
                                                    .sort((a, b) => new Date(b.logdate) - new Date(a.logdate))[0];
                                                return lastWeightLog 
                                                    ? `${parseFloat(lastWeightLog.weight).toFixed(1)} кг` 
                                                    : `${parseFloat(pet.currentweight).toFixed(1)} кг`;
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {pet.healthNotes && (
                                    <div className="info-card">
                                        <h3>Заметки о здоровье</h3>
                                        <p>{pet.healthNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div className="health-tab">
                            <div className="health-grid">
                                {reminderTypes.length > 0 ? (
                                    (() => {
                                        const cards = reminderTypes.map(reminderType => {
                                        const mapping = getReminderTypeFieldMapping(reminderType.rtname);
                                        if (!mapping) return null;

                                        // Показываем карточки ТОЛЬКО для событий, отмеченных в дневнике:
                                        // Берём последнюю дату выполнения ТОЛЬКО по дневнику (по соответствующему флагу в pet_logs)
                                        const fieldValue = mapping.logField ? getLastProcedureDate(mapping) : null;
                                        if (!fieldValue) return null;

                                        const editableFieldName = mapping?.petField || null;
                                        
                                        return (
                                            <div key={reminderType.id} className="health-card">
                                                <h3>{reminderType.rtname}</h3>
                                                <div className="health-item">
                                                    <span className="label">Последнее выполнение:</span>
                                                    <div className="date-controls">
                                                        {editableFieldName && editingDate === editableFieldName ? (
                                                            <div className="date-edit">
                                                                <input
                                                                    type="date"
                                                                    value={dateValue}
                                                                    onChange={(e) => setDateValue(e.target.value)}
                                                                    className="date-input"
                                                                />
                                                                <button onClick={handleSetToday} className="btn btn-sm btn-outline">Сегодня</button>
                                                                <button onClick={handleSaveDate} className="btn btn-sm btn-primary">✓</button>
                                                                <button onClick={handleCancelEdit} className="btn btn-sm btn-outline">✕</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="value" style={{marginRight: 0}}>
                                                                    {fieldValue ? formatDate(fieldValue) : 'Не указано'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                        });

                                        const visibleCards = cards.filter(Boolean);
                                        if (visibleCards.length === 0) {
                                            return (
                                                <div className="empty-state">
                                                    <p>Нет записей о выполненных процедурах. Отметьте процедуры в дневнике питомца.</p>
                                                </div>
                                            );
                                        }
                                        return visibleCards;
                                    })()
                                ) : (
                                    <div className="health-card">
                                        <h3>Медицинские процедуры</h3>
                                        <div className="health-item">
                                            <span className="label">Последняя вакцинация:</span>
                                            <div className="date-controls">
                                                {editingDate === 'lastVaccinated' ? (
                                                    <div className="date-edit">
                                                        <input
                                                            type="date"
                                                            value={dateValue}
                                                            onChange={(e) => setDateValue(e.target.value)}
                                                            className="date-input"
                                                        />
                                                        <button onClick={handleSetToday} className="btn btn-sm btn-outline">Сегодня</button>
                                                        <button onClick={handleSaveDate} className="btn btn-sm btn-primary">✓</button>
                                                        <button onClick={handleCancelEdit} className="btn btn-sm btn-outline">✕</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="value">{formatDate(pet.lastvaccinated)}</span>
                                                        <button 
                                                            onClick={() => handleEditDate('lastVaccinated', pet.lastvaccinated)}
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="health-item">
                                            <span className="label">Последний осмотр у ветеринара:</span>
                                            <div className="date-controls">
                                                {editingDate === 'lastInspected' ? (
                                                    <div className="date-edit">
                                                        <input
                                                            type="date"
                                                            value={dateValue}
                                                            onChange={(e) => setDateValue(e.target.value)}
                                                            className="date-input"
                                                        />
                                                        <button onClick={handleSetToday} className="btn btn-sm btn-outline">Сегодня</button>
                                                        <button onClick={handleSaveDate} className="btn btn-sm btn-primary">✓</button>
                                                        <button onClick={handleCancelEdit} className="btn btn-sm btn-outline">✕</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="value">{formatDate(pet.lastinspected)}</span>
                                                        <button 
                                                            onClick={() => handleEditDate('lastInspected', pet.lastinspected)}
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="health-item">
                                            <span className="label">Последний прием витаминов:</span>
                                            <div className="date-controls">
                                                {editingDate === 'lastVitamins' ? (
                                                    <div className="date-edit">
                                                        <input
                                                            type="date"
                                                            value={dateValue}
                                                            onChange={(e) => setDateValue(e.target.value)}
                                                            className="date-input"
                                                        />
                                                        <button onClick={handleSetToday} className="btn btn-sm btn-outline">Сегодня</button>
                                                        <button onClick={handleSaveDate} className="btn btn-sm btn-primary">✓</button>
                                                        <button onClick={handleCancelEdit} className="btn btn-sm btn-outline">✕</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="value">{formatDate(pet.lastvitamins)}</span>
                                                        <button 
                                                            onClick={() => handleEditDate('lastVitamins', pet.lastvitamins)}
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'breed' && (
                        <div className="breed-tab">
                            <div className="breed-tab-content">
                            <div 
                                className="breed-card"
                                onClick={() => navigate(`/breed/${pet.breed.id}`)}
                                    style={{ cursor: 'pointer' }}
                            >
                                <div className="breed-card-image">
                                    <img src={pet.breed.photo || '/default-breed.jpg'} alt={pet.breed.breedname} />
                                    <div className="breed-card-title-overlay">
                                        <h3 className="breed-card-title">{pet.breed.breedname}</h3>
                                    </div>
                                </div>
                                <div className="breed-card-content">
                                    <p className="breed-card-description">{pet.breed.short_description || pet.breed.description}</p>
                                    <div className="breed-card-arrow">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="logs-tab">
                            <div className="logs-header">
                                <h3>Дневник питомца</h3>
                                <button onClick={handleAddLog} className="btn btn-primary">
                                    + Добавить запись
                                </button>
                            </div>

                            {logs.length === 0 ? (
                                <div className="empty-state">
                                    <p>Нет дневных записей. Добавьте первую запись для отслеживания состояния питомца.</p>
                                </div>
                            ) : (
                                <div className="logs-list">
                                    {logs.map(log => (
                                        <div key={log.id} className="log-card" style={{ position: 'relative' }}>
                                            <div className="log-header">
                                                <h4>{formatDate(log.logdate)}</h4>
                                                <div className="log-actions-overlay">
                                                    <button
                                                        onClick={() => handleEditLog(log)}
                                                        className="btn-icon-overlay edit-btn"
                                                        title="Редактировать"
                                                    >
                                                        <img src="/icons/edit.svg" alt="Редактировать" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLog(log.id)}
                                                        className="btn-icon-overlay delete-btn"
                                                        title="Удалить"
                                                    >
                                                        <img src="/icons/delete.svg" alt="Удалить" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="log-content">
                                                {log.weight && (
                                                    <div className="log-item">
                                                        <span className="label">Вес:</span>
                                                        <span className="value">{log.weight} кг</span>
                                                    </div>
                                                )}
                                                {log.size && (
                                                    <div className="log-item">
                                                        <span className="label">Размер:</span>
                                                        <span className="value">{log.size} см</span>
                                                    </div>
                                                )}
                                                {log.mood && (
                                                    <div className="log-item">
                                                        <span className="label">Настроение:</span>
                                                        <span className="value">{renderMoodPaws(log.mood)}</span>
                                                    </div>
                                                )}
                                                {log.temperature && (
                                                    <div className="log-item">
                                                        <span className="label">Температура:</span>
                                                        <span className="value">{log.temperature}°C</span>
                                                    </div>
                                                )}
                                                {log.behavior && (
                                                    <div className="log-item">
                                                        <span className="label">Поведение:</span>
                                                        <span className="value">{log.behavior}</span>
                                                    </div>
                                                )}
                                                <div className="log-procedures">
                                                    {log.vaccination && <span className="procedure-badge">Вакцинация</span>}
                                                    {log.vet_inspection && <span className="procedure-badge">Осмотр ветеринара</span>}
                                                    {log.parasite_treatment && <span className="procedure-badge">Обработка от паразитов</span>}
                                                    {log.vitamins && <span className="procedure-badge">Витамины</span>}
                                                    {log.medication && <span className="procedure-badge">Лекарства</span>}
                                                    {log.bathing && <span className="procedure-badge">Купание</span>}
                                                    {log.grooming && <span className="procedure-badge">Груминг</span>}
                                                    {log.teeth_cleaning && <span className="procedure-badge">Чистка зубов</span>}
                                                    {log.nail_trimming && <span className="procedure-badge">Стрижка когтей</span>}
                                                </div>
                                                {log.notes && (
                                                    <div className="log-notes">
                                                        <span className="label">Заметки:</span>
                                                        <p>{log.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="stats-tab">
                            <PetStatsChart petId={id} pet={pet} />
                        </div>
                    )}
                </div>

                {showEditForm && (
                    <PetForm
                        pet={pet}
                        onSubmit={handleUpdatePet}
                        onClose={() => setShowEditForm(false)}
                    />
                )}

                {showLogForm && (
                    <DailyLogForm
                        petId={id}
                        existingLog={editingLog}
                    reminderTypes={reminderTypes}
                        onSuccess={handleLogSuccess}
                        onClose={() => {
                            setShowLogForm(false);
                            setEditingLog(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default PetDetailsPage;