import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { petsAPI } from '../services/api';
import ReminderForm from '../components/pets/ReminderForm';
import '../styles/Reminders.css';

const Reminders = () => {
    const [searchParams] = useSearchParams();
    const petIdParam = searchParams.get('pet');
    const [reminders, setReminders] = useState([]);
    const [pets, setPets] = useState([]);
    const [reminderTypes, setReminderTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [petFilter, setPetFilter] = useState(petIdParam || 'all');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (petIdParam) {
            setPetFilter(petIdParam);
        }
    }, [petIdParam]);

    const fetchData = async () => {
        try {
            const [remindersData, petsData, typesData] = await Promise.all([
                petsAPI.getReminders(),
                petsAPI.getMyPets(),
                petsAPI.getReminderTypes()
            ]);

            setReminders(remindersData);
            setPets(petsData);
            setReminderTypes(typesData);
        } catch (error) {
            setError('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReminder = async (reminderData) => {
        try {
            // Объединяем дату и время в один объект Date
            if (reminderData.reminderDate && reminderData.reminderTime) {
                const dateTimeString = `${reminderData.reminderDate}T${reminderData.reminderTime}`;
                reminderData.reminderDate = dateTimeString;
                delete reminderData.reminderTime;
            }
            
            // Подготавливаем данные для отправки
            const requestData = {
                petId: reminderData.petId,
                typeId: reminderData.typeId,
                reminderDate: reminderData.reminderDate,
                notes: reminderData.notes || '',
                frequencyType: reminderData.frequencyType || 'once',
                frequencyInterval: reminderData.frequencyInterval || null,
                frequencyUnit: reminderData.frequencyUnit || null,
                notificationType: reminderData.notificationType || 'at_start',
                notificationValue: reminderData.notificationValue || null,
                notificationUnit: reminderData.notificationUnit || null
            };

            await petsAPI.createReminder(requestData);
            await fetchData();
            setShowForm(false);
        } catch (error) {
            setError('Ошибка при создании напоминания');
        }
    };

    const handleUpdateStatus = async (reminderId, status) => {
        try {
            await petsAPI.updateReminderStatus(reminderId, status);
            await fetchData();
        } catch (error) {
            setError('Ошибка при обновлении статуса');
        }
    };

    const handleDeleteCompleted = async () => {
        const completedCount = reminders.filter(r => r.status === 'completed' && !r.hidden).length;
        if (completedCount === 0) {
            setError('Нет выполненных напоминаний для скрытия');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (window.confirm(`Вы уверены, что хотите скрыть все выполненные напоминания (${completedCount})?`)) {
            setError('');
            setSuccess('');
            try {
                const result = await petsAPI.deleteCompletedReminders();
                await fetchData();
                setSuccess(result.message || `Скрыто выполненных напоминаний: ${completedCount}`);
                setTimeout(() => setSuccess(''), 5000);
            } catch (error) {
                setError(error.response?.data?.message || 'Ошибка при скрытии выполненных напоминаний');
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const handleRestoreReminder = async (reminderId) => {
        try {
            await petsAPI.updateReminderStatus(reminderId, 'pending');
            await fetchData();
            setSuccess('Напоминание восстановлено');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Ошибка при восстановлении напоминания');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteReminder = async (reminderId) => {
        if (!reminderId) {
            setError('ID напоминания не указан');
            setTimeout(() => setError(''), 3000);
            return;
        }
        
        if (window.confirm('Вы уверены, что хотите удалить это напоминание?')) {
            try {
                await petsAPI.deleteReminder(reminderId);
                await fetchData();
                setSuccess('Напоминание удалено');
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                setError(error.response?.data?.message || 'Ошибка при удалении напоминания');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const filteredReminders = reminders.filter(reminder => {
        // Исключаем просроченные напоминания из отображения
        const reminderDate = new Date(reminder.reminderdate || reminder.reminderDate);
        const today = new Date();
        const isOverdue = reminderDate < today && reminder.status === 'pending';
        
        if (isOverdue) return false; // Не показываем просроченные
        
        // Фильтр по статусу
        if (filter !== 'all') {
            if (filter === 'pending' && reminder.status !== 'pending') return false;
            if (filter === 'completed' && reminder.status !== 'completed') return false;
            if (filter === 'cancelled' && reminder.status !== 'cancelled') return false;
        }
        
        // Фильтр по питомцу
        if (petFilter !== 'all') {
            const reminderPetId = reminder.pet?.id || reminder.petid;
            if (reminderPetId !== parseInt(petFilter)) return false;
        }
        
        return true;
    });

    const selectedPet = petIdParam ? pets.find(p => p.id === parseInt(petIdParam)) : null;

    const getUpcomingReminders = () => {
        const today = new Date();
        return reminders.filter(reminder => {
            const reminderDate = new Date(reminder.reminderdate || reminder.reminderDate);
            return reminderDate >= today && reminder.status === 'pending';
        });
    };


    if (loading) return <div className="loading">Загрузка напоминаний...</div>;

    return (
        <div className="reminders">
            <div className="container">
                <div className="page-header">
                    <h1>
                        {selectedPet ? `Напоминания для: ${selectedPet.petname}` : 'Напоминания по уходу'}
                    </h1>
                    <p>Управляйте напоминаниями о важных событиях для ваших питомцев</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary"
                        disabled={pets.length === 0}
                    >
                        Создать напоминание
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {pets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"
                             style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                            <img src={`${process.env.PUBLIC_URL || ''}/icons/reminders.svg`} alt="Напоминание" style={{width: '64px', height: '64px'}}/>
                        </div>
                        <h3>У вас пока нет питомцев</h3>
                        <p>Добавьте питомца, чтобы создавать напоминания по уходу за ним</p>
                    </div>
                ) : (
                    <>
                        <div className="reminders-stats">
                            <div className="stat-card">
                                <h3>{getUpcomingReminders().length}</h3>
                                <p>Предстоящие</p>
                            </div>
                            <div className="stat-card completed">
                                <h3>{reminders.filter(r => r.status === 'completed' && !r.hidden).length}</h3>
                                <p>Выполненные</p>
                            </div>
                        </div>

                        <div className="filters">
                            <div className="filter-group">
                                <div className="filter-buttons">
                                    <button
                                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                        onClick={() => setFilter('all')}
                                    >
                                        Все
                                    </button>
                                    <button
                                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                                        onClick={() => setFilter('pending')}
                                    >
                                        Активные
                                    </button>
                                    <button
                                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                                        onClick={() => setFilter('completed')}
                                    >
                                        Выполненные
                                    </button>
                                    <button
                                        className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                                        onClick={() => setFilter('cancelled')}
                                    >
                                        Отмененные
                                    </button>
                                </div>
                            </div>
                            <div className="filter-group" data-label="Питомец">
                                <select
                                    value={petFilter}
                                    onChange={(e) => setPetFilter(e.target.value)}
                                    className={`pet-filter-select ${petFilter !== 'all' ? 'filter-selected' : ''}`}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="all">Все питомцы</option>
                                    {pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>
                                            {pet.petname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="reminders-list">
                            {filteredReminders.length === 0 ? (
                                <div className="empty-state" style={{marginTop: 0}}>
                                    <h3>Напоминания не найдены</h3>
                                    <p style={{ marginBottom: 0 }}>Создайте первое напоминание для вашего питомца</p>
                                </div>
                            ) : (
                                filteredReminders.map(reminder => (
                                    <div key={reminder.id} className={`reminder-card ${reminder.status}`}>
                                        <div className="reminder-info">
                                            <h4>{reminder.type.name || reminder.type.rtname}</h4>
                                            <p className="pet-name">Питомец: {reminder.pet.petname || reminder.pet.name}</p>
                                            <p className="reminder-date">
                                                {new Date(reminder.reminderdate || reminder.reminderDate).toLocaleString('ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            {reminder.frequency_type && (
                                                <p className="reminder-frequency">
                                                    Периодичность: {
                                                        reminder.frequency_type === 'once' ? 'Один раз' :
                                                        reminder.frequency_type === 'daily' ? 'Ежедневно' :
                                                        reminder.frequency_type === 'weekly' ? 'Раз в неделю' :
                                                        reminder.frequency_type === 'monthly' ? 'Раз в месяц' :
                                                        reminder.frequency_type === 'yearly' ? 'Раз в год' :
                                                        reminder.frequency_type === 'custom' ? 
                                                            `Каждые ${reminder.frequency_interval} ${reminder.frequency_unit === 'day' ? 'день(дней)' : reminder.frequency_unit === 'week' ? 'неделя(недель)' : 'месяц(месяцев)'}` :
                                                        'Не указано'
                                                    }
                                                </p>
                                            )}
                                            {reminder.notification_type && (
                                                <p className="reminder-notification">
                                                    Оповещение: {
                                                        reminder.notification_type === 'at_start' ? 'Во время начала события' :
                                                        reminder.notification_type === '1min' ? 'За минуту' :
                                                        reminder.notification_type === '5min' ? 'За 5 минут' :
                                                        reminder.notification_type === '10min' ? 'За 10 минут' :
                                                        reminder.notification_type === '15min' ? 'За 15 минут' :
                                                        reminder.notification_type === '30min' ? 'За полчаса' :
                                                        reminder.notification_type === '1hour' ? 'За час' :
                                                        reminder.notification_type === '1day' ? 'За день' :
                                                        reminder.notification_type === 'custom' ?
                                                            `За ${reminder.notification_value} ${reminder.notification_unit === 'min' ? 'минут(ы)' : reminder.notification_unit === 'hour' ? 'час(а)' : 'день(дней)'}` :
                                                        'Не указано'
                                                    }
                                                </p>
                                            )}
                                            {reminder.notes && (
                                                <p className="reminder-notes">{reminder.notes}</p>
                                            )}
                                        </div>
                                        <div className="reminder-actions">
                                            {reminder.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(reminder.id, 'completed')}
                                                        className="btn btn-primary"
                                                    >
                                                        Выполнено
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(reminder.id, 'cancelled')}
                                                        className="btn btn-outline"
                                                    >
                                                        Отменить
                                                    </button>
                                                </>
                                            )}
                                            {reminder.status === 'completed' && (
                                                <>
                                                    <button
                                                        onClick={() => handleDeleteReminder(reminder.id)}
                                                        className="btn btn-danger"
                                                    >
                                                        Удалить
                                                    </button>
                                                </>
                                            )}
                                            {reminder.status === 'cancelled' && (
                                                <>
                                                    <button
                                                        onClick={() => handleRestoreReminder(reminder.id)}
                                                        className="btn btn-primary"
                                                    >
                                                        Восстановить
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReminder(reminder.id)}
                                                        className="btn btn-primary"
                                                    >
                                                        Удалить
                                                    </button>
                                                </>
                                            )}
                                            <span className={`status-badge ${reminder.status}`} style={{alignItems: 'center', display: 'flex'}}>
                        {reminder.status === 'pending' ? 'Активно' :
                            reminder.status === 'completed' ? 'Выполнено' : 'Отменено'}
                      </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {showForm && (
                    <ReminderForm
                        pets={pets}
                        reminderTypes={reminderTypes}
                        onSubmit={handleCreateReminder}
                        onClose={() => setShowForm(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default Reminders;