import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import '../../styles/ReminderTypeManagement.css';

const ReminderTypeManagement = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const data = await adminAPI.getReminderTypes();
            setTypes(data);
        } catch (error) {
            setError('Ошибка при загрузке типов напоминаний');
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = () => {
        setEditingType(null);
        setFormData({ name: '' });
        setShowForm(true);
        setError('');
    };

    const handleEditType = (type) => {
        setEditingType(type);
        setFormData({
            name: type.name || type.rtname
        });
        setShowForm(true);
        setError('');
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingType(null);
        setError('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim()) {
            setError('Заполните название типа напоминания');
            return;
        }
        setLoading(true);

        try {
            const payload = { name: formData.name.trim() };
            if (editingType) {
                await adminAPI.updateReminderType(editingType.id, payload);
            } else {
                await adminAPI.addReminderType(payload);
            }
            await fetchTypes();
            setShowForm(false);
            setEditingType(null);
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Ошибка при сохранении типа напоминания');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteType = async (typeId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот тип напоминания? Если существуют напоминания с этим типом, удаление будет невозможно.')) {
            setLoading(true);
            setError('');
            try {
                await adminAPI.deleteReminderType(typeId);
                await fetchTypes();
            } catch (error) {
                setError(error.response?.data?.message || error.message || 'Ошибка при удалении типа напоминания');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && types.length === 0) return <div className="loading">Загрузка...</div>;

    return (
        <div className="reminder-type-management">
            <div className="section-header">
                <button onClick={handleAddType} className="btn btn-primary">
                    Добавить тип напоминания
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="types-list">
                {types.length === 0 ? (
                    <div className="empty-state">
                        <p>Типы напоминаний не найдены. Добавьте первый тип.</p>
                    </div>
                ) : (
                    types.map(type => (
                        <div key={type.id} className="type-card" style={{ position: 'relative' }}>
                            <div className="type-info">
                                <h3>{type.name || type.rtname}</h3>
                            </div>
                            <div className="type-actions-overlay">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditType(type);
                                    }}
                                    className="btn-icon-overlay edit-btn"
                                    title="Редактировать"
                                >
                                    <img src="/icons/edit.svg" alt="Редактировать" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteType(type.id);
                                    }}
                                    className="btn-icon-overlay delete-btn"
                                    title="Удалить"
                                >
                                    <img src="/icons/delete.svg" alt="Удалить" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingType ? 'Редактировать тип напоминания' : 'Добавить тип напоминания'}</h2>
                            <button onClick={handleFormClose} className="close-btn">&times;</button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="type-form">
                            <div className="form-group">
                                <label htmlFor="name">Название типа напоминания *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    placeholder="Введите название типа напоминания"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={handleFormClose}
                                    className="btn btn-outline"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Сохранение...' : (editingType ? 'Обновить' : 'Добавить')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReminderTypeManagement;

