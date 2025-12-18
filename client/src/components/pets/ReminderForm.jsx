import React, { useState, useEffect } from 'react';
import '../../styles/ReminderForm.css';
import '../../styles/FloatingLabels.css';

const ReminderForm = ({ pets, reminderTypes, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        petId: '',
        typeId: '',
        reminderDate: '',
        reminderTime: '',
        notes: '',
        frequencyType: 'once',
        frequencyInterval: '',
        frequencyUnit: 'day',
        notificationType: 'at_start',
        notificationValue: '',
        notificationUnit: 'min'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            
            // При изменении единицы времени для уведомления, сбрасываем значение если оно выходит за пределы
            if (name === 'notificationUnit') {
                const maxValue = value === 'min' ? 60 : value === 'hour' ? 24 : 30;
                if (prev.notificationValue && parseInt(prev.notificationValue) > maxValue) {
                    newData.notificationValue = '';
                }
            }
            
            // При изменении единицы времени для периодичности, сбрасываем значение если оно выходит за пределы
            if (name === 'frequencyUnit') {
                // Для периодичности интервал всегда 1-100, так что ничего не нужно
            }
            
            return newData;
        });
        
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const today = new Date().toISOString().split('T')[0];
    
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
    }, [formData]);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Создать напоминание</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="reminder-form">
                    <div className="form-group floating-label-group">
                        <select
                            id="petId"
                            name="petId"
                            value={formData.petId}
                            onChange={handleChange}
                            className={formData.petId ? 'filter-selected' : ''}
                            required
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Выберите питомца</option>
                            {pets && pets.length > 0 ? (
                                pets.map(pet => (
                                    <option key={pet.id} value={pet.id}>
                                        {pet.petname || pet.name} ({pet.breed?.breedname || pet.breed?.name || 'Неизвестная порода'})
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>Нет доступных питомцев</option>
                            )}
                        </select>
                        <label htmlFor="petId">Питомец *</label>
                    </div>

                    <div className="form-group floating-label-group">
                        <select
                            id="typeId"
                            name="typeId"
                            value={formData.typeId}
                            onChange={handleChange}
                            className={formData.typeId ? 'filter-selected' : ''}
                            required
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Выберите тип</option>
                            {reminderTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name || type.rtname}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="typeId">Тип напоминания *</label>
                    </div>

                    <div className="form-group floating-label-group">
                        <input
                            type="date"
                            id="reminderDate"
                            name="reminderDate"
                            value={formData.reminderDate}
                            placeholder=" "
                            onChange={handleChange}
                            min={today}
                            required
                        />
                        <label htmlFor="reminderDate">Дата напоминания *</label>
                    </div>

                    <div className="form-group floating-label-group">
                        <input
                            type="time"
                            id="reminderTime"
                            name="reminderTime"
                            value={formData.reminderTime}
                            placeholder=" "
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="reminderTime">Время напоминания *</label>
                    </div>

                    <div className="form-group floating-label-group">
                        <select
                            id="frequencyType"
                            name="frequencyType"
                            value={formData.frequencyType}
                            onChange={handleChange}
                            className={formData.frequencyType ? 'filter-selected' : ''}
                            required
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="once">Один раз</option>
                            <option value="daily">Ежедневно</option>
                            <option value="weekly">Раз в неделю</option>
                            <option value="monthly">Раз в месяц</option>
                            <option value="yearly">Раз в год</option>
                            <option value="custom">Настроить частоту</option>
                        </select>
                        <label htmlFor="frequencyType">Периодичность *</label>
                    </div>

                    {formData.frequencyType === 'custom' && (
                        <>
                            <div className="form-group floating-label-group">
                                <input
                                    type="number"
                                    id="frequencyInterval"
                                    name="frequencyInterval"
                                    value={formData.frequencyInterval}
                                    onChange={handleChange}
                                    min="1"
                                    max="100"
                                    required={formData.frequencyType === 'custom'}
                                    placeholder=" "
                                />
                                <label htmlFor="frequencyInterval">Интервал (1-100) *</label>
                            </div>
                            <div className="form-group floating-label-group">
                                <select
                                    id="frequencyUnit"
                                    name="frequencyUnit"
                                    value={formData.frequencyUnit}
                                    onChange={handleChange}
                                    className={formData.frequencyUnit ? 'filter-selected' : ''}
                                    required={formData.frequencyType === 'custom'}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="day">День</option>
                                    <option value="week">Неделя</option>
                                    <option value="month">Месяц</option>
                                </select>
                                <label htmlFor="frequencyUnit">Единица времени *</label>
                            </div>
                        </>
                    )}

                    <div className="form-group floating-label-group">
                        <select
                            id="notificationType"
                            name="notificationType"
                            value={formData.notificationType}
                            onChange={handleChange}
                            className={formData.notificationType ? 'filter-selected' : ''}
                            required
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="at_start">Во время начала события</option>
                            <option value="1min">За минуту</option>
                            <option value="5min">За 5 минут</option>
                            <option value="10min">За 10 минут</option>
                            <option value="15min">За 15 минут</option>
                            <option value="30min">За полчаса</option>
                            <option value="1hour">За час</option>
                            <option value="1day">За день</option>
                            <option value="custom">Настроить время</option>
                        </select>
                        <label htmlFor="notificationType">Оповещение в Telegram *</label>
                    </div>

                    {formData.notificationType === 'custom' && (
                        <>
                            <div className="form-group floating-label-group">
                                <input
                                    type="number"
                                    id="notificationValue"
                                    name="notificationValue"
                                    value={formData.notificationValue}
                                    onChange={handleChange}
                                    min="1"
                                    max={formData.notificationUnit === 'min' ? 60 : formData.notificationUnit === 'hour' ? 24 : 30}
                                    required={formData.notificationType === 'custom'}
                                    placeholder=" "
                                />
                                <label htmlFor="notificationValue">
                                    Значение * ({formData.notificationUnit === 'min' ? '1-60' : formData.notificationUnit === 'hour' ? '1-24' : '1-30'})
                                </label>
                            </div>
                            <div className="form-group floating-label-group">
                                <select
                                    id="notificationUnit"
                                    name="notificationUnit"
                                    value={formData.notificationUnit}
                                    onChange={handleChange}
                                    className={formData.notificationUnit ? 'filter-selected' : ''}
                                    required={formData.notificationType === 'custom'}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="min">Минуты (1-60)</option>
                                    <option value="hour">Часы (1-24)</option>
                                    <option value="day">Дни (1-30)</option>
                                </select>
                                <label htmlFor="notificationUnit">Единица времени *</label>
                            </div>
                        </>
                    )}

                    <div className="form-group floating-label-group">
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder=" "
                        />
                        <label htmlFor="notes">Заметки</label>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Создать напоминание
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReminderForm;