import React, { useState, useEffect } from 'react';
import { breedRequestsAPI, petsAPI } from '../services/api';
import '../styles/BreedRequest.css';
import '../styles/FloatingLabels.css';

const BreedRequest = () => {
    const [formData, setFormData] = useState({
        breedName: '',
        speciesId: '',
        shortDescription: '',
        description: '',
        photo: '',
        photoFile: null,
        photoSource: '', // 'url' or 'file'
        hypoallergenicity: false,
        trainability: '',
        weight: '',
        height: '',
        size: '',
        lifespan: '',
        countryOfOrigin: '',
        // Общие характеристики
        shedding: '',
        activity: '',
        friendliness: '',
        cleanliness: '',
        otherAnimalsAttitude: '',
        // Характеристики для кошек
        grooming: '',
        affection: '',
        furType: '',
        // Характеристики для собак
        guardQualities: '',
        groomingNeeds: '',
        noise: '',
        // Новые поля
        pros: '',
        cons: '',
        galleryFiles: [] // Массив файлов для галереи
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSpecies();
    }, []);
    
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
            setSpecies(data);
        } catch (error) {
            setError('Ошибка при загрузке видов животных');
        }
    };

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
        
        // Для селектов также обновляем класс
        if (e.target.tagName === 'SELECT') {
            if (value && value.trim() !== '') {
                e.target.classList.add('filter-selected');
            } else {
                e.target.classList.remove('filter-selected', 'filter-selected-photo');
            }
        }
    };

    const handlePhotoSourceChange = (e) => {
        setFormData(prev => ({
            ...prev,
            photoSource: e.target.value,
            photo: '',
            photoFile: null
        }));
        setPhotoPreview(null);
        
        // Обновляем класс для плавающей метки
        const formGroup = e.target.closest('.floating-label-group');
        if (formGroup) {
            if (e.target.value && e.target.value.trim() !== '') {
                formGroup.classList.add('has-value');
                e.target.classList.add('filter-selected');
            } else {
                formGroup.classList.remove('has-value');
                e.target.classList.remove('filter-selected', 'filter-selected-photo');
            }
        }
    };

    const handlePhotoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                photoFile: file
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoUrlChange = (e) => {
        setFormData(prev => ({
            ...prev,
            photo: e.target.value
        }));
        if (e.target.value) {
            setPhotoPreview(e.target.value);
        } else {
            setPhotoPreview(null);
        }
    };


    const handleGalleryFilesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => {
                const newFiles = [...prev.galleryFiles, ...files];
                // Создаем превью для новых файлов
                const newPreviews = files.map(file => URL.createObjectURL(file));
                // Обновляем превью: только файлы
                setGalleryPreviews([...galleryPreviews, ...newPreviews]);
                return { ...prev, galleryFiles: newFiles };
            });
            // Очищаем input
            e.target.value = '';
        }
    };

    const removeGalleryItem = (index) => {
        // Удаляем файл
        const previewToRevoke = galleryPreviews[index];
        if (previewToRevoke && previewToRevoke.startsWith('blob:')) {
            URL.revokeObjectURL(previewToRevoke);
        }
        setFormData(prev => {
            const newFiles = prev.galleryFiles.filter((_, i) => i !== index);
            const filePreviews = newFiles.map(f => URL.createObjectURL(f));
            setGalleryPreviews(filePreviews);
            return { ...prev, galleryFiles: newFiles };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Валидация: проверяем, что фото указано
        if (formData.photoSource === 'url' && !formData.photo) {
            setError('Пожалуйста, укажите URL фотографии');
            setLoading(false);
            return;
        }
        if (formData.photoSource === 'file' && !formData.photoFile) {
            setError('Пожалуйста, выберите файл фотографии');
            setLoading(false);
            return;
        }

        try {
            let requestData;
            if (formData.photoSource === 'file' && formData.photoFile) {
                // Если загружается файл, используем FormData
                const formDataToSend = new FormData();
                formDataToSend.append('breedName', formData.breedName);
                formDataToSend.append('speciesId', formData.speciesId);
                formDataToSend.append('shortDescription', formData.shortDescription || '');
                formDataToSend.append('description', formData.description);
                formDataToSend.append('photoFile', formData.photoFile);
                formDataToSend.append('hypoallergenicity', formData.hypoallergenicity.toString());
                formDataToSend.append('trainability', formData.trainability || '');
                formDataToSend.append('weight', formData.weight);
                formDataToSend.append('height', formData.height);
                formDataToSend.append('size', formData.size);
                formDataToSend.append('lifespan', formData.lifespan);
                formDataToSend.append('countryOfOrigin', formData.countryOfOrigin);
                // Общие характеристики
                if (formData.shedding) formDataToSend.append('shedding', formData.shedding);
                if (formData.activity) formDataToSend.append('activity', formData.activity);
                if (formData.friendliness) formDataToSend.append('friendliness', formData.friendliness);
                if (formData.cleanliness) formDataToSend.append('cleanliness', formData.cleanliness);
                if (formData.otherAnimalsAttitude) formDataToSend.append('otherAnimalsAttitude', formData.otherAnimalsAttitude);
                // Характеристики для кошек
                if (formData.grooming) formDataToSend.append('grooming', formData.grooming);
                if (formData.affection) formDataToSend.append('affection', formData.affection);
                if (formData.furType) formDataToSend.append('furType', formData.furType);
                // Характеристики для собак
                if (formData.guardQualities) formDataToSend.append('guardQualities', formData.guardQualities);
                if (formData.groomingNeeds) formDataToSend.append('groomingNeeds', formData.groomingNeeds);
                if (formData.noise) formDataToSend.append('noise', formData.noise);
                // Новые поля
                if (formData.pros) formDataToSend.append('pros', formData.pros);
                if (formData.cons) formDataToSend.append('cons', formData.cons);
                // Добавляем файлы галереи
                formData.galleryFiles.forEach((file) => {
                    formDataToSend.append('galleryFiles', file);
                });
                requestData = formDataToSend;
            } else {
                // Если используется URL, отправляем обычный объект
                requestData = {
                    ...formData,
                    photoFile: undefined,
                    shortDescription: formData.shortDescription || undefined,
                    hypoallergenicity: formData.hypoallergenicity,
                    // Общие характеристики
                    shedding: formData.shedding || undefined,
                    activity: formData.activity || undefined,
                    friendliness: formData.friendliness || undefined,
                    cleanliness: formData.cleanliness || undefined,
                    otherAnimalsAttitude: formData.otherAnimalsAttitude || undefined,
                    // Характеристики для кошек
                    grooming: formData.grooming || undefined,
                    affection: formData.affection || undefined,
                    furType: formData.furType || undefined,
                    // Характеристики для собак
                    guardQualities: formData.guardQualities || undefined,
                    groomingNeeds: formData.groomingNeeds || undefined,
                    noise: formData.noise || undefined,
                    pros: formData.pros || undefined,
                    cons: formData.cons || undefined
                };
                
                // Если есть файлы галереи, нужно использовать FormData
                if (formData.galleryFiles && formData.galleryFiles.length > 0) {
                    const formDataToSend = new FormData();
                    Object.keys(requestData).forEach(key => {
                        if (key !== 'galleryFiles') {
                            formDataToSend.append(key, requestData[key] || '');
                        }
                    });
                    formData.galleryFiles.forEach((file) => {
                        formDataToSend.append('galleryFiles', file);
                    });
                    requestData = formDataToSend;
                }
            }
            
            await breedRequestsAPI.createRequest(requestData);
            setSuccess('Заявка успешно отправлена! Она будет рассмотрена администратором.');
            setFormData({
                breedName: '',
                speciesId: '',
                shortDescription: '',
                description: '',
                photo: '',
                photoFile: null,
                photoSource: '',
                hypoallergenicity: false,
                trainability: '',
                weight: '',
                height: '',
                size: '',
                lifespan: '',
                countryOfOrigin: '',
                shedding: '',
                    activity: '',
                    friendliness: '',
                    cleanliness: '',
                    otherAnimalsAttitude: '',
                    grooming: '',
                    affection: '',
                    furType: '',
                    guardQualities: '',
                    groomingNeeds: '',
                    noise: '',
                pros: '',
                cons: '',
                galleryFiles: []
            });
            setPhotoPreview(null);
            setGalleryPreviews([]);
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при отправке заявки');
        } finally {
            setLoading(false);
        }
    };

    // Определяем выбранный вид и тип животного (кошка/собака) для характеристик
    const selectedSpecies = species.find(s => s.id === parseInt(formData.speciesId));
    const speciesName = selectedSpecies?.speciesname?.toLowerCase() || '';
    const isCat = speciesName.includes('кошк') || speciesName.includes('cat');
    const isDog = speciesName.includes('собак') || speciesName.includes('dog');

    return (
        <div className="breed-request">
            <div className="container">
                <div className="page-header">
                    <h1>Заявка на добавление породы</h1>
                    <p>Предложите новую породу для добавления в наш каталог</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="breed-request-layout">
                    <div className="request-guidelines">
                        <h3>Рекомендации по заполнению заявки</h3>
                        <ul>
                            <li>Убедитесь, что порода еще не добавлена в наш каталог</li>
                            <li>Предоставьте достоверную и проверенную информацию</li>
                            <li>Используйте качественные фотографии породы</li>
                            <li>Опишите особенности ухода и содержания</li>
                            <li>Заявка будет рассмотрена администратором в течение 3-5 рабочих дней</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit} className="breed-request-form">
                    <div className="form-section" style={{ marginTop: 0 }}>
                        <h3 style={{ marginBottom: 10 }}>Основная информация</h3>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <input
                                type="text"
                                id="breedName"
                                name="breedName"
                                value={formData.breedName}
                                onChange={handleChange}
                                placeholder=" "
                                required
                            />
                            <label htmlFor="breedName">Название породы *</label>
                        </div>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <select
                                id="speciesId"
                                name="speciesId"
                                value={formData.speciesId || ''}
                                onChange={handleChange}
                                className={formData.speciesId ? 'filter-selected' : ''}
                                required
                                style={{
                                    backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                    backgroundSize: '16px 16px',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center'
                                }}
                            >
                                <option value="">Выберите вид</option>
                                {species && species.length > 0 ? (
                                    species.map(specie => (
                                        <option key={specie.id} value={specie.id}>
                                            {specie.speciesname || specie.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Загрузка видов...</option>
                                )}
                            </select>
                            <label htmlFor="speciesId">Вид животного *</label>
                        </div>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <textarea
                                id="shortDescription"
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleChange}
                                rows="2"
                                placeholder=" "
                            />
                            <label htmlFor="shortDescription">Краткое описание породы</label>
                        </div>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="description">Полное описание породы *</label>
                        </div>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <select
                                id="photoSource"
                                name="photoSource"
                                value={formData.photoSource || ''}
                                onChange={handlePhotoSourceChange}
                                className={formData.photoSource ? 'filter-selected' : ''}
                                required
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
                            <label htmlFor="photoSource">Источник фото *</label>
                        </div>

                        {formData.photoSource === 'url' ? (
                            <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                                <input
                                    type="url"
                                    id="photo"
                                    name="photo"
                                    value={formData.photo}
                                    onChange={handlePhotoUrlChange}
                                    required={formData.photoSource === 'url'}
                                    placeholder=" "
                                />
                                <label htmlFor="photo">URL фотографии породы *</label>
                                {photoPreview && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img 
                                            src={photoPreview} 
                                            alt="Preview" 
                                            style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                                            onError={() => setPhotoPreview(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : formData.photoSource === 'file' ? (
                            <div className="form-group" style={{ marginBottom: 10 }}>
                                <div className="avatar-upload">
                                    <input
                                        type="file"
                                        id="photoFile"
                                        name="photoFile"
                                        accept="image/*"
                                        onChange={handlePhotoFileChange}
                                        required={formData.photoSource === 'file'}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="avatar-preview full-size">
                                        {photoPreview ? (
                                            <div className="avatar-image full-size">
                                                <img 
                                                    src={photoPreview} 
                                                    alt="Preview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                                <button type="button" onClick={() => {
                                                    setFormData(prev => ({ ...prev, photoFile: null }));
                                                    setPhotoPreview(null);
                                                }} className="remove-avatar">
                                                    <img src={`${process.env.PUBLIC_URL || ''}/icons/cross.svg`} alt="Удалить" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="avatar-placeholder" style={{ background: 'none' }}>
                                                <p>Фото не выбрано</p>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => document.getElementById('photoFile').click()}
                                        className="btn btn-outline"
                                    >
                                        {photoPreview ? 'Изменить фото' : 'Выбрать фото'}
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        <div className="form-row" style={{ marginBottom: 10 }}>
                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <input
                                    type="text"
                                    id="weight"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="weight">Вес * (число-число)</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <input
                                    type="text"
                                    id="height"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="height">Рост * (число-число)</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="size"
                                    name="size"
                                    value={formData.size || ''}
                                    onChange={handleChange}
                                    className={formData.size ? 'filter-selected' : ''}
                                    required
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">Выберите размер</option>
                                    <option value="small">Маленький</option>
                                    <option value="medium">Средний</option>
                                    <option value="large">Крупный</option>
                                </select>
                                <label htmlFor="size">Размер *</label>
                            </div>
                        </div>

                        <div className="form-row" style={{ marginBottom: 10, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <input
                                    type="text"
                                    id="lifespan"
                                    name="lifespan"
                                    value={formData.lifespan}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="lifespan">Продолжительность жизни * (число-число)</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <input
                                    type="text"
                                    id="countryOfOrigin"
                                    name="countryOfOrigin"
                                    value={formData.countryOfOrigin}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                />
                                <label htmlFor="countryOfOrigin">Страна происхождения *</label>
                            </div>
                        </div>

                        <div className="form-group checkbox-group" style={{ marginTop: 0, marginBottom: 10 }}>
                            <label className="checkbox-label-styled">
                                <input
                                    type="checkbox"
                                    name="hypoallergenicity"
                                    checked={formData.hypoallergenicity}
                                    onChange={handleChange}
                                />
                                <span className="checkbox-custom"></span>
                                Гипоаллергенная порода
                            </label>
                        </div>

                        <h3 style={{ marginBottom: 10 }}>Характеристики породы</h3>

                        <div className="characteristics-grid" style={{ margin: 0 }}>
                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="shedding"
                                    name="shedding"
                                    value={formData.shedding || ''}
                                    onChange={handleChange}
                                    className={formData.shedding ? 'filter-selected' : ''}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">Не указано</option>
                                    <option value="1">1 - Почти не линяет</option>
                                    <option value="2">2 - Мало линяет</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Много линяет</option>
                                    <option value="5">5 - Сильно линяет</option>
                                </select>
                                <label htmlFor="shedding">Линька</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="trainability"
                                    name="trainability"
                                    value={formData.trainability || ''}
                                    onChange={handleChange}
                                    className={formData.trainability ? 'filter-selected' : ''}
                                    disabled={!isDog}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isDog ? 'Не указано' : 'Только для собак'}</option>
                                    <option value="1">1 - Очень сложно</option>
                                    <option value="2">2 - Сложно</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Легко</option>
                                    <option value="5">5 - Очень легко</option>
                                </select>
                                <label htmlFor="trainability">Дрессируемость</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="otherAnimalsAttitude"
                                    name="otherAnimalsAttitude"
                                    value={formData.otherAnimalsAttitude || ''}
                                    onChange={handleChange}
                                    className={formData.otherAnimalsAttitude ? 'filter-selected' : ''}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">Не указано</option>
                                    <option value="1">1 - Очень плохо</option>
                                    <option value="2">2 - Плохо</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Хорошо</option>
                                    <option value="5">5 - Очень хорошо</option>
                                </select>
                                <label htmlFor="otherAnimalsAttitude">Отношение к другим животным</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="activity"
                                    name="activity"
                                    value={formData.activity || ''}
                                    onChange={handleChange}
                                    className={formData.activity ? 'filter-selected' : ''}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">Не указано</option>
                                    <option value="1">1 - Очень спокойная</option>
                                    <option value="2">2 - Спокойная</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Активная</option>
                                    <option value="5">5 - Очень активная</option>
                                </select>
                                <label htmlFor="activity">Активность</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="friendliness"
                                    name="friendliness"
                                    value={formData.friendliness || ''}
                                    onChange={handleChange}
                                    className={formData.friendliness ? 'filter-selected' : ''}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">Не указано</option>
                                    <option value="1">1 - Очень недружелюбная</option>
                                    <option value="2">2 - Недружелюбная</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Дружелюбная</option>
                                    <option value="5">5 - Очень дружелюбная</option>
                                </select>
                                <label htmlFor="friendliness">Дружелюбность</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="furType"
                                    name="furType"
                                    value={formData.furType || ''}
                                    onChange={handleChange}
                                    className={formData.furType ? 'filter-selected' : ''}
                                    disabled={!isCat}
                                    required={isCat}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isCat ? 'Выберите тип' : 'Только для кошек'}</option>
                                    <option value="длинношерстная">Длинношерстная</option>
                                    <option value="короткошерстная">Короткошерстная</option>
                                </select>
                                <label htmlFor="furType">Тип шерсти {isCat && '*'}</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="grooming"
                                    name="grooming"
                                    value={formData.grooming || ''}
                                    onChange={handleChange}
                                    className={formData.grooming ? 'filter-selected' : ''}
                                    disabled={!isCat}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isCat ? 'Не указано' : 'Только для кошек'}</option>
                                    <option value="1">1 - Редко</option>
                                    <option value="2">2 - Иногда</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Часто</option>
                                    <option value="5">5 - Очень часто</option>
                                </select>
                                <label htmlFor="grooming">Потребность в уходе</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="cleanliness"
                                    name="cleanliness"
                                    value={formData.cleanliness || ''}
                                    onChange={handleChange}
                                    className={formData.cleanliness ? 'filter-selected' : ''}
                                    disabled={!isCat}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isCat ? 'Не указано' : 'Только для кошек'}</option>
                                    <option value="1">1 - Очень нечистоплотная</option>
                                    <option value="2">2 - Скорее нечистоплотная</option>
                                    <option value="3">3 - Средне</option>
                                    <option value="4">4 - Чистоплотная</option>
                                    <option value="5">5 - Очень чистоплотная</option>
                                </select>
                                <label htmlFor="cleanliness">Чистоплотность</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="affection"
                                    name="affection"
                                    value={formData.affection || ''}
                                    onChange={handleChange}
                                    className={formData.affection ? 'filter-selected' : ''}
                                    disabled={!isCat}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isCat ? 'Не указано' : 'Только для кошек'}</option>
                                    <option value="1">1 🐾</option>
                                    <option value="2">2 🐾🐾</option>
                                    <option value="3">3 🐾🐾🐾</option>
                                    <option value="4">4 🐾🐾🐾🐾</option>
                                    <option value="5">5 🐾🐾🐾🐾🐾</option>
                                </select>
                                <label htmlFor="affection">Ласковость</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                                <select
                                    id="guardQualities"
                                    name="guardQualities"
                                    value={formData.guardQualities || ''}
                                    onChange={handleChange}
                                    className={formData.guardQualities ? 'filter-selected' : ''}
                                    disabled={!isDog}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isDog ? 'Не указано' : 'Только для собак'}</option>
                                    <option value="1">1 🐾</option>
                                    <option value="2">2 🐾🐾</option>
                                    <option value="3">3 🐾🐾🐾</option>
                                    <option value="4">4 🐾🐾🐾🐾</option>
                                    <option value="5">5 🐾🐾🐾🐾🐾</option>
                                </select>
                                <label htmlFor="guardQualities">Охранные качества</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                                <select
                                    id="groomingNeeds"
                                    name="groomingNeeds"
                                    value={formData.groomingNeeds || ''}
                                    onChange={handleChange}
                                    className={formData.groomingNeeds ? 'filter-selected' : ''}
                                    disabled={!isDog}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isDog ? 'Не указано' : 'Только для собак'}</option>
                                    <option value="1">1 🐾</option>
                                    <option value="2">2 🐾🐾</option>
                                    <option value="3">3 🐾🐾🐾</option>
                                    <option value="4">4 🐾🐾🐾🐾</option>
                                    <option value="5">5 🐾🐾🐾🐾🐾</option>
                                </select>
                                <label htmlFor="groomingNeeds">Потребность в вычесывании</label>
                            </div>

                            <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                                <select
                                    id="noise"
                                    name="noise"
                                    value={formData.noise || ''}
                                    onChange={handleChange}
                                    className={formData.noise ? 'filter-selected' : ''}
                                    disabled={!isDog}
                                    style={{
                                        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                        backgroundSize: '16px 16px',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center'
                                    }}
                                >
                                    <option value="">{isDog ? 'Не указано' : 'Только для собак'}</option>
                                    <option value="1">1 🐾</option>
                                    <option value="2">2 🐾🐾</option>
                                    <option value="3">3 🐾🐾🐾</option>
                                    <option value="4">4 🐾🐾🐾🐾</option>
                                    <option value="5">5 🐾🐾🐾🐾🐾</option>
                                </select>
                                <label htmlFor="noise">Шум</label>
                            </div>
                        </div>

                        <h3 style={{ marginBottom: 10 }}>Плюсы и минусы</h3>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <textarea
                                id="pros"
                                name="pros"
                                value={formData.pros}
                                onChange={handleChange}
                                rows="3"
                                placeholder=" "
                            />
                            <label htmlFor="pros">Плюсы породы</label>
                        </div>

                        <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                            <textarea
                                id="cons"
                                name="cons"
                                value={formData.cons}
                                onChange={handleChange}
                                rows="3"
                                placeholder=" "
                            />
                            <label htmlFor="cons">Минусы породы</label>
                        </div>

                        <h3 style={{ marginBottom: 10 }}>Галерея фотографий</h3>
                        <div className="form-group" style={{ marginBottom: 10 }}>
                            <div className="gallery-upload">
                                <input
                                    type="file"
                                    id="galleryFiles"
                                    name="galleryFiles"
                                    accept="image/*"
                                    multiple
                                    onChange={handleGalleryFilesChange}
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => document.getElementById('galleryFiles').click()}
                                    className="btn btn-outline"
                                >
                                    Добавить фото в галерею
                                </button>
                            </div>
                        </div>

                        {(galleryPreviews.length > 0) && (
                            <div className="gallery-preview" style={{ marginTop: '20px' }}>
                                <p style={{ marginBottom: '10px', fontWeight: 500 }}>Предпросмотр ({galleryPreviews.length} фото):</p>
                                <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                                    {galleryPreviews.map((preview, index) => {
                                        return (
                                            <div key={index} className="gallery-item" style={{ position: 'relative', aspectRatio: '1' }}>
                                                <img 
                                                    src={preview} 
                                                    alt={`Preview ${index + 1}`}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'cover', 
                                                        borderRadius: '8px',
                                                        border: '2px solid #ddd'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryItem(index)}
                                                    className="remove-gallery-item"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        background: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                        padding: 0
                                                    }}
                                                >
                                                    <img src={`${process.env.PUBLIC_URL || ''}/icons/cross.svg`} alt="Удалить" style={{ width: '14px', height: '14px', filter: 'brightness(0) invert(1)' }} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        </div> {/* form-section */}

                        {/* Блок действий формы */}

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Отправка...' : 'Отправить заявку'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BreedRequest;