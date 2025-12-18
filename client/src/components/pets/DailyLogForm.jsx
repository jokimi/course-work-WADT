import React, { useState, useEffect } from 'react';
import { petsAPI } from '../../services/api';
import '../../styles/DailyLogForm.css';
import '../../styles/FloatingLabels.css';

const DailyLogForm = ({ petId, onSuccess, onClose, existingLog = null, reminderTypes = [] }) => {
    const [formData, setFormData] = useState({
        logdate: new Date().toISOString().split('T')[0],
        weight: '',
        size: '',
        mood: '',
        temperature: '',
        behavior: '',
        vaccination: false,
        vet_inspection: false,
        parasite_treatment: false,
        vitamins_medication: false,
        vitamins: false,
        medication: false,
        bathing: false,
        grooming: false,
        teeth_cleaning: false,
        nail_trimming: false,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Функция для корректного форматирования даты без сдвига из-за часового пояса
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return new Date().toISOString().split('T')[0];
        const date = new Date(dateValue);
        // Используем локальное время, а не UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (existingLog) {
            setFormData({
                logdate: formatDateForInput(existingLog.logdate),
                weight: existingLog.weight || '',
                size: existingLog.size || '',
                mood: existingLog.mood || '',
                temperature: existingLog.temperature || '',
                behavior: existingLog.behavior || '',
                vaccination: existingLog.vaccination || false,
                vet_inspection: existingLog.vet_inspection || false,
                parasite_treatment: existingLog.parasite_treatment || false,
                vitamins_medication: existingLog.vitamins_medication || false,
                vitamins: existingLog.vitamins || false,
                medication: existingLog.medication || false,
                bathing: existingLog.bathing || false,
                grooming: existingLog.grooming || false,
                teeth_cleaning: existingLog.teeth_cleaning || false,
                nail_trimming: existingLog.nail_trimming || false,
                notes: existingLog.notes || ''
            });
        }
    }, [existingLog]);

    // Инициализация классов has-value для полей с начальными значениями
    useEffect(() => {
        const formGroups = document.querySelectorAll('.floating-label-group');
        formGroups.forEach(group => {
            const input = group.querySelector('input, textarea');
            if (input && input.value && input.value.trim() !== '') {
                group.classList.add('has-value');
            }
        });
    }, [formData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                 ...formData
            };
            // Если редактируем существующую запись, передаем её ID
            const logData = existingLog 
                ? { ...payload, logId: existingLog.id }
                : payload;
            await petsAPI.createPetLog(petId, logData);
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при сохранении записи');
        } finally {
            setLoading(false);
        }
    };

    const renderRatingInput = (name, label, value) => {
        return (
            <div className="rating-input">
                <label>{label}</label>
                <div className="rating-buttons">
                    {[1, 2, 3, 4, 5].map(num => (
                        <button
                            key={num}
                            type="button"
                            className={`rating-btn ${value == num ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, [name]: num }))}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

     const normalizeName = (s) => (s || '').toString().trim().toLowerCase();

     const hasReminderTypeByKeywords = (keywords) => {
        if (!reminderTypes || reminderTypes.length === 0) return false;
         const normalizedKeywords = keywords.map(normalizeName);
         return reminderTypes.some(t => {
             const name = normalizeName(t.rtname);
             return normalizedKeywords.some(k => name.includes(k));
         });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content daily-log-form-modal">
                <div className="modal-header">
                    <h2>{existingLog ? 'Редактировать запись' : 'Добавить дневную запись'}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="daily-log-form">
                    <div className="form-group floating-label-group" style={{marginTop: 10, marginBottom: 0}}>
                        <input
                            type="date"
                            id="logdate"
                            name="logdate"
                            value={formData.logdate}
                            onChange={handleChange}
                            placeholder=" "
                            required
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <label htmlFor="logdate">Дата записи *</label>
                    </div>

                    <div className="form-row" style={{marginBottom: 0}}>
                        <div className="form-group floating-label-group" style={{marginBottom: 0}}>
                            <input
                                type="number"
                                id="weight"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                placeholder=" "
                            />
                            <label htmlFor="weight">Вес (кг)</label>
                        </div>

                        <div className="form-group floating-label-group" style={{marginBottom: 0}}>
                            <input
                                type="number"
                                id="size"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                placeholder=" "
                            />
                            <label htmlFor="size">Размер (см)</label>
                        </div>
                    </div>

                    {renderRatingInput('mood', 'Настроение:', formData.mood)}

                    <div className="form-group floating-label-group" style={{marginBottom: 0}}>
                        <input
                            type="number"
                            id="temperature"
                            name="temperature"
                            value={formData.temperature}
                            onChange={handleChange}
                            step="0.1"
                            min="35"
                            max="42"
                            placeholder=" "
                        />
                        <label htmlFor="temperature">Температура (°C)</label>
                    </div>

                    <div className="form-group floating-label-group" style={{marginBottom: 0}}>
                        <textarea
                            id="behavior"
                            name="behavior"
                            value={formData.behavior}
                            onChange={handleChange}
                            rows="3"
                            placeholder=" "
                        />
                        <label htmlFor="behavior">Как себя вел питомец?</label>
                    </div>

                    <div className="form-section" style={{marginBottom: 0}}>
                        <h3 style={{marginBottom: 0}}>Процедуры по уходу</h3>
                        <div className="checkbox-group" style={{marginBottom: 0, marginTop: 0}}>
                             {/* Показываем только те процедуры, для которых есть соответствующий тип напоминания */}
                             {hasReminderTypeByKeywords(['вакцин']) && (
                                 <label className="checkbox-label-styled">
                                     <input
                                         type="checkbox"
                                         name="vaccination"
                                         checked={formData.vaccination}
                                         onChange={handleChange}
                                     />
                                     <span className="checkbox-custom"></span>
                                     Вакцинация
                                 </label>
                             )}
                             {hasReminderTypeByKeywords(['осмотр']) && (
                                <label className="checkbox-label-styled">
                                    <input
                                        type="checkbox"
                                        name="vet_inspection"
                                        checked={formData.vet_inspection}
                                        onChange={handleChange}
                                    />
                                    <span className="checkbox-custom"></span>
                                    Осмотр ветеринара
                                </label>
                            )}
                             {hasReminderTypeByKeywords(['паразит']) && (
                                <label className="checkbox-label-styled">
                                    <input
                                        type="checkbox"
                                        name="parasite_treatment"
                                        checked={formData.parasite_treatment}
                                        onChange={handleChange}
                                    />
                                    <span className="checkbox-custom"></span>
                                    Обработка от паразитов
                                </label>
                            )}
                             {hasReminderTypeByKeywords(['витамин']) && (
                                <label className="checkbox-label-styled">
                                    <input
                                        type="checkbox"
                                        name="vitamins"
                                        checked={formData.vitamins}
                                        onChange={handleChange}
                                    />
                                    <span className="checkbox-custom"></span>
                                    Прием витаминов
                                </label>
                            )}
                             {hasReminderTypeByKeywords(['лекар']) && (
                                <label className="checkbox-label-styled">
                                    <input
                                        type="checkbox"
                                        name="medication"
                                        checked={formData.medication}
                                        onChange={handleChange}
                                    />
                                    <span className="checkbox-custom"></span>
                                    Прием лекарств
                                </label>
                            )}
                             {hasReminderTypeByKeywords(['купани']) && (
                                 <label className="checkbox-label-styled">
                                     <input
                                         type="checkbox"
                                         name="bathing"
                                         checked={formData.bathing}
                                         onChange={handleChange}
                                     />
                                     <span className="checkbox-custom"></span>
                                     Купание
                                 </label>
                             )}
                             {hasReminderTypeByKeywords(['грум', 'стрижка шерсти']) && (
                                 <label className="checkbox-label-styled">
                                     <input
                                         type="checkbox"
                                         name="grooming"
                                         checked={formData.grooming}
                                         onChange={handleChange}
                                     />
                                     <span className="checkbox-custom"></span>
                                     Груминг
                                 </label>
                             )}
                             {hasReminderTypeByKeywords(['зуб']) && (
                                 <label className="checkbox-label-styled">
                                     <input
                                         type="checkbox"
                                         name="teeth_cleaning"
                                         checked={formData.teeth_cleaning}
                                         onChange={handleChange}
                                     />
                                     <span className="checkbox-custom"></span>
                                     Чистка зубов
                                 </label>
                             )}
                             {hasReminderTypeByKeywords(['ког']) && (
                                 <label className="checkbox-label-styled">
                                     <input
                                         type="checkbox"
                                         name="nail_trimming"
                                         checked={formData.nail_trimming}
                                         onChange={handleChange}
                                     />
                                     <span className="checkbox-custom"></span>
                                     Стрижка когтей
                                 </label>
                             )}
                        </div>
                    </div>

                    <div className="form-group floating-label-group" style={{marginBottom: 0}}>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder=" "
                        />
                        <label htmlFor="notes">Дополнительные заметки</label>
                    </div>

                    <div className="form-actions" style={{marginTop: 0}}>
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
                            disabled={loading}
                        >
                            {loading ? 'Сохранение...' : (existingLog ? 'Обновить' : 'Сохранить')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DailyLogForm;

