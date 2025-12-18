import React, { useState, useEffect } from 'react';
import { petsAPI } from '../../services/api';
import '../../styles/PetForm.css';
import '../../styles/FloatingLabels.css';

const PetForm = ({ pet, prefillBreed, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        speciesId: '',
        breedId: '',
        name: '',
        avatar: null,
        avatarFile: null,
        avatarUrl: '',
        avatarSource: '', // 'url' or 'file'
        birthday: '',
        gender: true,
        currentWeight: '',
        healthNotes: '',
        lastVaccinated: '',
        lastInspected: '',
        lastVitamins: ''
    });
    const [breeds, setBreeds] = useState([]);
    const [species, setSpecies] = useState([]);
    const [filteredBreeds, setFilteredBreeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        fetchSpecies();
        fetchBreeds();
    }, []);

    useEffect(() => {
        if (prefillBreed && !pet) {
            // Предзаполнение формы при добавлении питомца с выбранной породой
            const speciesId = prefillBreed.speciesid || prefillBreed.species?.id || '';
            setFormData(prev => ({
                ...prev,
                speciesId: speciesId,
                breedId: prefillBreed.id
            }));
        }
    }, [prefillBreed, pet]);

    useEffect(() => {
        if (pet) {
            const avatar = pet.avatar || '';
            const speciesId = pet.breed?.speciesid || pet.breed?.species?.id || '';
            setFormData({
                speciesId: speciesId,
                breedId: pet.breedid,
                name: pet.petname,
                avatar: avatar,
                avatarFile: null,
                avatarUrl: avatar.startsWith('http') ? avatar : '',
                avatarSource: avatar ? (avatar.startsWith('http') ? 'url' : 'file') : '',
                birthday: pet.birthday.split('T')[0],
                gender: pet.gender,
                currentWeight: pet.currentweight,
                healthNotes: pet.healthnotes || '',
                lastVaccinated: pet.lastvaccinated ? pet.lastvaccinated.split('T')[0] : '',
                lastInspected: pet.lastinspected ? pet.lastinspected.split('T')[0] : '',
                lastVitamins: pet.lastvitamins ? pet.lastvitamins.split('T')[0] : ''
            });
            if (avatar) {
                setAvatarPreview(avatar.startsWith('http') ? avatar : `http://localhost:5000${avatar}`);
            }
        }
    }, [pet]);

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

    const fetchSpecies = async () => {
        try {
            const data = await petsAPI.getSpecies();
            setSpecies(data || []);
        } catch (error) {
            console.error('Error fetching species:', error);
        }
    };

    const fetchBreeds = async () => {
        try {
            const data = await petsAPI.getAllBreeds();
            setBreeds(data || []);
        } catch (error) {
            console.error('Error fetching breeds:', error);
        }
    };

    // Фильтруем породы по выбранному виду
    useEffect(() => {
        if (formData.speciesId) {
            const filtered = breeds.filter(breed => breed.speciesid === parseInt(formData.speciesId));
            setFilteredBreeds(filtered);
            // Сбрасываем выбранную породу только если она не принадлежит выбранному виду
            // И только если это не начальная загрузка данных (когда pet уже есть)
            if (formData.breedId && breeds.length > 0) {
                const currentBreed = breeds.find(b => b.id === parseInt(formData.breedId));
                if (currentBreed && currentBreed.speciesid !== parseInt(formData.speciesId)) {
                    setFormData(prev => ({ ...prev, breedId: '' }));
                }
            }
        } else {
            setFilteredBreeds([]);
        }
    }, [formData.speciesId, breeds]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        // Если меняется вид, проверяем нужно ли сбрасывать породу
        if (name === 'speciesId') {
            setFormData(prev => {
                // Проверяем, принадлежит ли текущая порода новому виду
                const currentBreed = breeds.find(b => b.id === parseInt(prev.breedId));
                const shouldResetBreed = currentBreed && currentBreed.speciesid !== parseInt(value);
                
                return {
                    ...prev,
                    speciesId: value,
                    breedId: shouldResetBreed ? '' : prev.breedId // Сбрасываем только если порода не принадлежит новому виду
                };
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : (name === 'gender' ? value === 'true' : value)
            }));
        }
        
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

    const handleAvatarSourceChange = (e) => {
        setFormData(prev => ({
            ...prev,
            avatarSource: e.target.value,
            avatarFile: null,
            avatarUrl: ''
        }));
        setAvatarPreview(null);
        
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

    const handleAvatarFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                avatarFile: file
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUrlChange = (e) => {
        setFormData(prev => ({
            ...prev,
            avatarUrl: e.target.value
        }));
        if (e.target.value) {
            setAvatarPreview(e.target.value);
        } else {
            setAvatarPreview(null);
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

    const removeAvatar = () => {
        setFormData(prev => ({
            ...prev,
            avatar: null,
            avatarFile: null,
            avatarUrl: ''
        }));
        setAvatarPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let petData;
            // Конвертируем gender в boolean
            const genderValue = typeof formData.gender === 'boolean' ? formData.gender : formData.gender === 'true' || formData.gender === true;
            
            if (formData.avatarSource === 'file' && formData.avatarFile) {
                // Если загружается файл, используем FormData
                const formDataToSend = new FormData();
                formDataToSend.append('breedId', formData.breedId);
                formDataToSend.append('name', formData.name);
                formDataToSend.append('avatarFile', formData.avatarFile);
                formDataToSend.append('birthday', formData.birthday);
                formDataToSend.append('gender', genderValue.toString());
                formDataToSend.append('currentWeight', formData.currentWeight);
                formDataToSend.append('healthNotes', formData.healthNotes || '');
                petData = formDataToSend;
            } else {
                // Если используется URL или нет файла, отправляем обычный объект
                petData = {
                    ...formData,
                    gender: genderValue,
                    avatar: formData.avatarSource === 'url' ? formData.avatarUrl : (formData.avatar || null),
                    avatarFile: undefined
                };
            }
            await onSubmit(petData);
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при сохранении питомца');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{pet ? 'Редактировать питомца' : 'Добавить питомца'}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="pet-form">
                    <div className="form-group floating-label-group">
                        <select
                            id="speciesId"
                            name="speciesId"
                            value={formData.speciesId || ''}
                            onChange={handleChange}
                            className={formData.speciesId ? 'filter-selected' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                            required
                        >
                            <option value="">Выберите вид животного *</option>
                            {species.map(specie => (
                                <option key={specie.id} value={specie.id}>
                                    {specie.speciesname || specie.name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="speciesId">Вид животного *</label>
                    </div>

                    {formData.speciesId && (
                        <div className="form-group floating-label-group">
                            <select
                                id="breedId"
                                name="breedId"
                                value={formData.breedId || ''}
                                onChange={handleChange}
                                className={formData.breedId ? 'filter-selected' : ''}
                                style={{
                                    backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                    backgroundSize: '16px 16px',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center'
                                }}
                                required
                            >
                                <option value="">Выберите породу *</option>
                                {filteredBreeds.map(breed => (
                                    <option key={breed.id} value={breed.id}>
                                        {breed.breedname}
                                    </option>
                                ))}
                            </select>
                            <label htmlFor="breedId">Порода *</label>
                        </div>
                    )}

                    <div className="form-group floating-label-group">
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder=" "
                            required
                        />
                        <label htmlFor="name">Кличка *</label>
                    </div>

                    <div className="form-group floating-label-group">
                        <select
                            id="avatarSource"
                            name="avatarSource"
                            value={formData.avatarSource || ''}
                            onChange={handleAvatarSourceChange}
                            className={formData.avatarSource ? 'filter-selected-photo' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Выберите источник фото</option>
                            <option value="url">Из интернета (URL)</option>
                            <option value="file">С компьютера</option>
                        </select>
                        <label htmlFor="avatarSource">Источник фото</label>
                    </div>

                    {formData.avatarSource === 'url' ? (
                        <div className="form-group floating-label-group">
                            <input
                                type="url"
                                id="avatarUrl"
                                name="avatarUrl"
                                value={formData.avatarUrl}
                                onChange={handleAvatarUrlChange}
                                placeholder=" "
                            />
                            <label htmlFor="avatarUrl">URL аватара (https://example.com/pet-avatar.jpg)</label>
                            {avatarPreview && (
                                <div style={{ marginTop: '10px' }}>
                                    <img 
                                        src={avatarPreview} 
                                        alt="Preview" 
                                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                                        onError={() => setAvatarPreview(null)}
                                    />
                                </div>
                            )}
                        </div>
                    ) : formData.avatarSource === 'file' ? (
                        <div className="form-group">
                            <label htmlFor="avatar">Аватар питомца</label>
                            <div className="avatar-upload">
                                <input
                                    type="file"
                                    id="avatar"
                                    name="avatar"
                                    accept="image/*"
                                    onChange={handleAvatarFileChange}
                                    style={{ display: 'none' }}
                                />
                                <div className="avatar-preview">
                                    {avatarPreview ? (
                                        <div className="avatar-image">
                                            <img 
                                                src={avatarPreview} 
                                                alt="Аватар питомца" 
                                            />
                                            <button type="button" onClick={removeAvatar} className="remove-avatar">×</button>
                                        </div>
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <p>Фото не выбрано</p>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => document.getElementById('avatar').click()}
                                    className="btn btn-outline"
                                >
                                    {avatarPreview ? 'Изменить фото' : 'Выбрать фото'}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="form-row" style={{ marginBottom: 0 }}>
                        <div className="form-group floating-label-group">
                            <input
                                type="date"
                                id="birthday"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleChange}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="birthday">Дата рождения *</label>
                        </div>

                        <div className="form-group floating-label-group">
                            <input
                                type="number"
                                id="currentWeight"
                                name="currentWeight"
                                value={formData.currentWeight}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="currentWeight">Вес (кг) *</label>
                        </div>
                    </div>

                        <div className="form-group">
                        <label style={{ marginBottom: '10px', display: 'block' }}>Пол *</label>
                        <div className="radio-group gender-radio-group">
                            <label className={`gender-radio-label ${formData.gender === true ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value={true}
                                    checked={formData.gender === true}
                                    onChange={handleChange}
                                />
                                <img 
                                    src={`${process.env.PUBLIC_URL || ''}/icons/male.svg`}
                                    alt="male"
                                    className="gender-icon"
                                />
                                <span>Мужской</span>
                            </label>
                            <label className={`gender-radio-label ${formData.gender === false ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value={false}
                                    checked={formData.gender === false}
                                    onChange={handleChange}
                                />
                                <img 
                                    src={`${process.env.PUBLIC_URL || ''}/icons/female.svg`}
                                    alt="female"
                                    className="gender-icon"
                                />
                                <span>Женский</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group floating-label-group">
                        <textarea
                            id="healthNotes"
                            name="healthNotes"
                            value={formData.healthNotes}
                            onChange={handleChange}
                            rows="3"
                            placeholder=" "
                        />
                        <label htmlFor="healthNotes">Заметки о здоровье</label>
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
                            disabled={loading}
                        >
                            {loading ? 'Сохранение...' : (pet ? 'Обновить' : 'Добавить')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PetForm;