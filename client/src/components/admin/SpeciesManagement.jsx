import React, { useState, useEffect } from 'react';
import { adminAPI, petsAPI } from '../../services/api';
import '../../styles/SpeciesManagement.css';
import '../../styles/FloatingLabels.css';

const SpeciesManagement = () => {
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '',
        iconFile: null,
        iconSource: 'url', // 'url' or 'file'
        description: '',
        removeIcon: false
    });
    const [iconPreview, setIconPreview] = useState(null);

    useEffect(() => {
        fetchSpecies();
    }, []);

    // Инициализация классов has-value для полей с начальными значениями
    useEffect(() => {
        if (showForm) {
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
        }
    }, [formData, showForm]);

    const fetchSpecies = async () => {
        try {
            console.log('Fetching species...');
            const data = await petsAPI.getSpecies();
            console.log('Species data received:', data);
            setSpecies(data);
        } catch (error) {
            console.error('Error fetching species:', error);
            setError(`Ошибка при загрузке видов животных: ${error.message || error.response?.data?.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSpecies = () => {
        setEditingSpecies(null);
        setFormData({ name: '', icon: '', iconFile: null, iconSource: '', description: '', removeIcon: false });
        setIconPreview(null);
        setShowForm(true);
    };

    const handleEditSpecies = (specie) => {
        setEditingSpecies(specie);
        const icon = specie.speciesicon || '';
        setFormData({
            name: specie.speciesname,
            icon: icon,
            iconFile: null,
            iconSource: icon ? (icon.startsWith('http') ? 'url' : 'file') : 'url',
            description: specie.description || '',
            removeIcon: false
        });
        if (icon) {
            setIconPreview(icon.startsWith('http') ? icon : `http://localhost:5000${icon}`);
        }
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingSpecies(null);
        setIconPreview(null);
        setFormData(prev => ({ ...prev, removeIcon: false }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validateForm = () => {
            if (!formData.name.trim()) {
                return 'Заполните название вида';
            }
            if (
                formData.iconSource === 'file' &&
                !formData.iconFile &&
                !formData.removeIcon &&
                !(editingSpecies && (formData.icon || iconPreview))
            ) {
                return 'Выберите файл иконки или смените источник';
            }
            if (formData.iconSource === 'url' && formData.icon) {
                try {
                    // Простая проверка корректности URL
                    new URL(formData.icon);
                } catch (err) {
                    return 'Укажите корректный URL иконки';
                }
            }
            return '';
        };

        const validationMessage = validateForm();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setLoading(true);

        try {
            let speciesData;
            const normalizedName = formData.name.trim();
            const normalizedDescription = formData.description?.trim() || '';
            if (formData.iconSource === 'file' && formData.iconFile) {
                // Если загружается файл, используем FormData
                const formDataToSend = new FormData();
                formDataToSend.append('name', normalizedName);
                formDataToSend.append('iconFile', formData.iconFile);
                if (normalizedDescription) {
                    formDataToSend.append('description', normalizedDescription);
                }
                if (formData.removeIcon) {
                    formDataToSend.append('removeIcon', 'true');
                }
                speciesData = formDataToSend;
            } else {
                // Если используется URL, отправляем обычный объект
                speciesData = {
                    name: normalizedName,
                    icon: formData.icon?.trim() || null,
                    description: normalizedDescription || null,
                    removeIcon: formData.removeIcon || undefined
                };
            }
            
            console.log('Submitting species data:', speciesData);
            if (editingSpecies) {
                console.log('Updating species:', editingSpecies.id);
                await adminAPI.updateSpecies(editingSpecies.id, speciesData);
            } else {
                console.log('Adding new species');
                await adminAPI.addSpecies(speciesData);
            }
            console.log('Species saved successfully, refreshing list...');
            await fetchSpecies();
            setShowForm(false);
            setEditingSpecies(null);
            setIconPreview(null);
            setFormData(prev => ({ ...prev, removeIcon: false }));
        } catch (error) {
            console.error('Error saving species:', error);
            setError(`Ошибка при сохранении вида: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSpecies = async (speciesId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот вид? Все связанные породы также будут удалены.')) {
            try {
                await adminAPI.deleteSpecies(speciesId);
                await fetchSpecies();
            } catch (error) {
                setError(error.response?.data?.message || error.message || 'Ошибка при удалении вида');
            }
        }
    };

    const handleIconSourceChange = (e) => {
        setFormData(prev => ({
            ...prev,
            iconSource: e.target.value,
            icon: '',
            iconFile: null,
            removeIcon: false
        }));
        setIconPreview(null);
        
        // Обновляем класс для плавающей метки
        const formGroup = e.target.closest('.floating-label-group');
        if (formGroup) {
            if (e.target.value && e.target.value.trim() !== '') {
                formGroup.classList.add('has-value');
                e.target.classList.add('filter-selected-photo');
            } else {
                formGroup.classList.remove('has-value');
                e.target.classList.remove('filter-selected-photo');
            }
        }
    };

    const handleIconFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                iconFile: file,
                removeIcon: false
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIconUrlChange = (e) => {
        setFormData(prev => ({
            ...prev,
            icon: e.target.value,
            removeIcon: false
        }));
        if (e.target.value) {
            setIconPreview(e.target.value);
        } else {
            setIconPreview(null);
        }
        
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

    const handleRemoveIcon = () => {
        setFormData(prev => ({
            ...prev,
            icon: '',
            iconFile: null,
            iconSource: '',
            removeIcon: true
        }));
        setIconPreview(null);
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="species-management">
            <div className="section-header">
                <button onClick={handleAddSpecies} className="btn btn-primary">
                    Добавить вид
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="species-list">
                {species.map(specie => (
                    <div key={specie.id} className="species-card" style={{ position: 'relative' }}>
                        <div className="species-info">
                            <div className="species-icon">
                                {specie.speciesicon ? (
                                    <img src={specie.speciesicon} alt={specie.speciesname}/>
                                ) : (
                                    <span>🐾</span>
                                )}
                            </div>
                            <div className="species-details">
                                <h3>{specie.speciesname}</h3>
                            </div>
                            <div className="species-actions-overlay">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSpecies(specie);
                                    }}
                                    className="btn-icon-overlay edit-btn"
                                    title="Редактировать"
                                >
                                    <img src="/icons/edit.svg" alt="Редактировать"/>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSpecies(specie.id);
                                    }}
                                    className="btn-icon-overlay delete-btn"
                                    title="Удалить"
                                >
                                    <img src="/icons/delete.svg" alt="Удалить"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingSpecies ? 'Редактировать вид' : 'Добавить вид'}</h2>
                            <button onClick={handleFormClose} className="close-btn">&times;</button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="species-form">
                            <div className="form-group floating-label-group">
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData(prev => ({...prev, name: e.target.value}));
                                        const formGroup = e.target.closest('.floating-label-group');
                                        if (formGroup) {
                                            if (e.target.value && e.target.value.trim() !== '') {
                                                formGroup.classList.add('has-value');
                                            } else {
                                                formGroup.classList.remove('has-value');
                                            }
                                        }
                                    }}
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="name">Название вида *</label>
                            </div>

                            <div className="form-group floating-label-group">
                                <select
                                    id="iconSource"
                                    name="iconSource"
                                    value={formData.iconSource || ''}
                                    onChange={handleIconSourceChange}
                                    className={formData.iconSource ? 'filter-selected-photo' : ''}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">Выберите источник иконки</option>
                                    <option value="url">Из интернета (URL)</option>
                                    <option value="file">С компьютера</option>
                                </select>
                                <label htmlFor="iconSource">Источник иконки</label>
                            </div>

                            {formData.iconSource === 'url' ? (
                                <div className="form-group floating-label-group">
                                    <input
                                        type="url"
                                        id="icon"
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleIconUrlChange}
                                        placeholder=" "
                                    />
                                    <label htmlFor="icon">URL иконки</label>
                                    {iconPreview && (
                                        <div style={{ marginTop: '10px' }}>
                                            <img 
                                                src={iconPreview} 
                                                alt="Preview" 
                                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px' }}
                                                onError={() => setIconPreview(null)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : formData.iconSource === 'file' ? (
                                <div className="form-group">
                                    <label htmlFor="iconFile">Иконка</label>
                                    <div className="avatar-upload">
                                        <input
                                            type="file"
                                            id="iconFile"
                                            name="iconFile"
                                            accept="image/*"
                                            onChange={handleIconFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="avatar-preview">
                                            {iconPreview ? (
                                                <div className="avatar-image">
                                                    <img 
                                                        src={iconPreview} 
                                                        alt="Preview"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                    />
                                                    <button type="button" onClick={() => {
                                                        setFormData(prev => ({ ...prev, iconFile: null, removeIcon: false }));
                                                        setIconPreview(null);
                                                    }} className="remove-avatar">×</button>
                                                </div>
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    <p>Фото не выбрано</p>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => document.getElementById('iconFile').click()}
                                            className="btn btn-outline"
                                        >
                                            {iconPreview ? 'Изменить фото' : 'Выбрать фото'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {editingSpecies && (iconPreview || formData.icon || editingSpecies?.speciesicon) && !formData.removeIcon && (
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={handleRemoveIcon}
                                        className="btn btn-outline"
                                    >
                                        Убрать фото
                                    </button>
                                </div>
                            )}

                            <div className="form-group floating-label-group">
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, description: e.target.value }));
                                        const formGroup = e.target.closest('.floating-label-group');
                                        if (formGroup) {
                                            if (e.target.value && e.target.value.trim() !== '') {
                                                formGroup.classList.add('has-value');
                                            } else {
                                                formGroup.classList.remove('has-value');
                                            }
                                        }
                                    }}
                                    rows="4"
                                    placeholder=" "
                                />
                                <label htmlFor="description">Описание вида (необязательно)</label>
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
                                    {loading ? 'Сохранение...' : (editingSpecies ? 'Обновить' : 'Добавить')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeciesManagement;