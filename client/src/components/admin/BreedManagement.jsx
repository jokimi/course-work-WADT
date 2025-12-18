import React, { useState, useEffect } from 'react';
import { adminAPI, petsAPI } from '../../services/api';
import '../../styles/BreedManagement.css';
import '../../styles/FloatingLabels.css';

const BreedManagement = () => {
    const [breeds, setBreeds] = useState([]);
    const [filteredBreeds, setFilteredBreeds] = useState([]);
    const [species, setSpecies] = useState([]);
    const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingBreed, setEditingBreed] = useState(null);
    const [formData, setFormData] = useState({
        speciesId: '',
        name: '',
        shortDescription: '',
        description: '',
        photo: '',
        photoFile: null,
        photoSource: 'url', // 'url' or 'file'
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

    useEffect(() => {
        fetchBreeds();
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

    const fetchBreeds = async () => {
        try {
            console.log('Fetching breeds...');
            const data = await petsAPI.getBreeds();
            console.log('Breeds data received:', data);
            const breedsList = data.breeds || [];
            setBreeds(breedsList);
            setFilteredBreeds(breedsList);
        } catch (error) {
            console.error('Error fetching breeds:', error);
            setError(`Ошибка при загрузке пород: ${error.message || error.response?.data?.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    // Фильтрация пород по виду животных
    useEffect(() => {
        if (selectedSpeciesId) {
            const filtered = breeds.filter(breed => {
                const breedSpeciesId = breed.speciesId || breed.speciesid || breed.species?.id;
                return breedSpeciesId === parseInt(selectedSpeciesId);
            });
            setFilteredBreeds(filtered);
        } else {
            setFilteredBreeds(breeds);
        }
    }, [breeds, selectedSpeciesId]);

    const fetchSpecies = async () => {
        try {
            console.log('Fetching species for breed management...');
            const data = await petsAPI.getSpecies();
            console.log('Species data for breeds received:', data);
            setSpecies(data);
        } catch (error) {
            console.error('Error fetching species for breeds:', error);
        }
    };

    const handleAddBreed = () => {
        setError('');
        setEditingBreed(null);
        setFormData({
            speciesId: '',
            name: '',
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
        setShowForm(true);
    };

    const handleEditBreed = (breed) => {
        setError('');
        setEditingBreed(breed);
        const photo = breed.photo || breed.breedphoto || '';
        let galleryArray = [];
        if (breed.gallery) {
            try {
                galleryArray = JSON.parse(breed.gallery);
            } catch {
                galleryArray = [];
            }
        }
        setFormData({
            speciesId: breed.speciesId || breed.speciesid,
            name: breed.name || breed.breedname,
            shortDescription: breed.short_description || breed.shortDescription || '',
            description: breed.description,
            photo: photo,
            photoFile: null,
            photoSource: photo ? (photo.startsWith('http') ? 'url' : 'file') : 'url',
            hypoallergenicity: breed.hypoallergenicity,
            trainability: breed.trainability || '',
            weight: breed.weight,
            height: breed.height,
            size: breed.size,
            lifespan: breed.lifespan,
            countryOfOrigin: breed.countryOfOrigin || breed.countryoforigin,
            shedding: breed.shedding || '',
            activity: breed.activity || '',
            friendliness: breed.friendliness || '',
        cleanliness: breed.cleanliness || '',
        otherAnimalsAttitude: breed.otherAnimalsAttitude || breed.other_animals_attitude || '',
            grooming: breed.grooming || '',
            affection: breed.affection || '',
            furType: breed.fur_type || breed.furType || '',
            guardQualities: breed.guardQualities || breed.guard_qualities || '',
            groomingNeeds: breed.groomingNeeds || breed.grooming_needs || '',
            noise: breed.noise || '',
            pros: (() => {
                if (!breed.pros) return '';
                try {
                    const parsed = JSON.parse(breed.pros);
                    if (Array.isArray(parsed)) {
                        return parsed.join('\n');
                    }
                } catch (e) {
                    // не JSON — используем как есть
                }
                return breed.pros;
            })(),
            cons: (() => {
                if (!breed.cons) return '';
                try {
                    const parsed = JSON.parse(breed.cons);
                    if (Array.isArray(parsed)) {
                        return parsed.join('\n');
                    }
                } catch (e) {
                    // не JSON — используем как есть
                }
                return breed.cons;
            })(),
            gallery: galleryArray,
            galleryFiles: []
        });
        if (photo) {
            setPhotoPreview(photo.startsWith('http') ? photo : `http://localhost:5000${photo}`);
        }
        // Устанавливаем превью для галереи (только URL, файлов нет при редактировании)
        const galleryUrlPreviews = galleryArray.map(url => 
            url.startsWith('http') ? url : `http://localhost:5000${url}`
        );
        setGalleryPreviews(galleryUrlPreviews);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setError('');
        // Очищаем превью галереи
        galleryPreviews.forEach(preview => {
            if (preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        });
        setShowForm(false);
        setEditingBreed(null);
        setGalleryPreviews([]);
    };

    const rangeRegex = /^\d+(\.\d+)?(-\d+(\.\d+)?)?$/;

    const validateBreedForm = () => {
        const errors = [];
        if (!formData.speciesId) errors.push('Выберите вид животного');
        if (!formData.name.trim()) errors.push('Заполните название породы');
        if (!formData.description.trim()) errors.push('Заполните полное описание породы');
        if (!formData.weight || !rangeRegex.test(formData.weight.trim())) errors.push('Вес укажите в формате число или диапазон через тире');
        if (!formData.height || !rangeRegex.test(formData.height.trim())) errors.push('Рост укажите в формате число или диапазон через тире');
        if (!formData.lifespan || !rangeRegex.test(formData.lifespan.trim())) errors.push('Продолжительность жизни укажите в формате число или диапазон через тире');
        if (!formData.size) errors.push('Укажите размер породы');
        if (!formData.countryOfOrigin.trim()) errors.push('Укажите страну происхождения');
        if (!formData.photoSource) errors.push('Выберите источник фото породы');
        if (formData.photoSource === 'url' && !formData.photo.trim()) errors.push('Укажите ссылку на фото породы');
        if (formData.photoSource === 'file' && !formData.photoFile && !editingBreed) errors.push('Загрузите фото породы');
        if (formData.photoSource === 'file' && editingBreed && !formData.photoFile && !formData.photo) errors.push('Добавьте фото породы');

        return errors.join('. ');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validationMessage = validateBreedForm();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }
        setLoading(true);

        try {
            // Плюсы и минусы как массивы строк
            const prosArray = formData.pros
                ? formData.pros
                    .split('\n')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                : [];
            const consArray = formData.cons
                ? formData.cons
                    .split('\n')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                : [];

            const prosValue = prosArray.length > 0 ? JSON.stringify(prosArray) : '';
            const consValue = consArray.length > 0 ? JSON.stringify(consArray) : '';
            const normalizedName = formData.name.trim();
            const normalizedShortDescription = formData.shortDescription?.trim() || '';
            const normalizedDescription = formData.description.trim();
            const normalizedCountry = formData.countryOfOrigin.trim();
            const normalizedPhoto = formData.photo?.trim() || '';

            let breedData;
            if (formData.photoSource === 'file' && formData.photoFile) {
                // Если загружается файл, используем FormData
                const formDataToSend = new FormData();
                formDataToSend.append('speciesId', formData.speciesId);
                formDataToSend.append('name', normalizedName);
                formDataToSend.append('shortDescription', normalizedShortDescription);
                formDataToSend.append('description', normalizedDescription);
                formDataToSend.append('photoFile', formData.photoFile);
                formDataToSend.append('hypoallergenicity', formData.hypoallergenicity.toString());
                formDataToSend.append('trainability', formData.trainability || '');
                formDataToSend.append('weight', formData.weight.trim());
                formDataToSend.append('height', formData.height.trim());
                formDataToSend.append('size', formData.size);
                formDataToSend.append('lifespan', formData.lifespan.trim());
                formDataToSend.append('countryOfOrigin', normalizedCountry);
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
                if (prosValue) formDataToSend.append('pros', prosValue);
                if (consValue) formDataToSend.append('cons', consValue);
                // Добавляем файлы галереи
                formData.galleryFiles.forEach((file, index) => {
                    formDataToSend.append(`galleryFiles`, file);
                });
                // Добавляем URL галереи (если есть при редактировании)
                if (formData.gallery && formData.gallery.length > 0) {
                    formDataToSend.append('gallery', JSON.stringify(formData.gallery));
                }
                breedData = formDataToSend;
            } else if (formData.galleryFiles && formData.galleryFiles.length > 0) {
                // Если есть файлы галереи, используем FormData даже если фото через URL
                const formDataToSendGallery = new FormData();
                formDataToSendGallery.append('speciesId', formData.speciesId);
                formDataToSendGallery.append('name', normalizedName);
                formDataToSendGallery.append('shortDescription', normalizedShortDescription);
                formDataToSendGallery.append('description', normalizedDescription);
                formDataToSendGallery.append('photo', normalizedPhoto);
                formDataToSendGallery.append('hypoallergenicity', formData.hypoallergenicity.toString());
                formDataToSendGallery.append('trainability', formData.trainability || '');
                formDataToSendGallery.append('weight', formData.weight.trim());
                formDataToSendGallery.append('height', formData.height.trim());
                formDataToSendGallery.append('size', formData.size);
                formDataToSendGallery.append('lifespan', formData.lifespan.trim());
                formDataToSendGallery.append('countryOfOrigin', normalizedCountry);
                if (formData.shedding) formDataToSendGallery.append('shedding', formData.shedding);
                if (formData.activity) formDataToSendGallery.append('activity', formData.activity);
                if (formData.friendliness) formDataToSendGallery.append('friendliness', formData.friendliness);
                if (formData.cleanliness) formDataToSendGallery.append('cleanliness', formData.cleanliness);
                if (formData.otherAnimalsAttitude) formDataToSendGallery.append('otherAnimalsAttitude', formData.otherAnimalsAttitude);
                if (formData.grooming) formDataToSendGallery.append('grooming', formData.grooming);
                if (formData.affection) formDataToSendGallery.append('affection', formData.affection);
                if (formData.furType) formDataToSendGallery.append('furType', formData.furType);
                if (formData.guardQualities) formDataToSendGallery.append('guardQualities', formData.guardQualities);
                if (formData.groomingNeeds) formDataToSendGallery.append('groomingNeeds', formData.groomingNeeds);
                if (formData.noise) formDataToSendGallery.append('noise', formData.noise);
                if (prosValue) formDataToSendGallery.append('pros', prosValue);
                if (consValue) formDataToSendGallery.append('cons', consValue);
                formData.galleryFiles.forEach((file) => {
                    formDataToSendGallery.append('galleryFiles', file);
                });
                // Добавляем URL галереи (если есть при редактировании)
                if (formData.gallery && formData.gallery.length > 0) {
                    formDataToSendGallery.append('gallery', JSON.stringify(formData.gallery));
                }
                breedData = formDataToSendGallery;
            } else {
                // Если используется URL и нет файлов галереи, отправляем обычный объект
                breedData = {
                    ...formData,
                    name: normalizedName,
                    shortDescription: normalizedShortDescription || undefined,
                    description: normalizedDescription,
                    photo: normalizedPhoto,
                    photoFile: undefined,
                    galleryFiles: undefined,
                    weight: formData.weight.trim(),
                    height: formData.height.trim(),
                    lifespan: formData.lifespan.trim(),
                    countryOfOrigin: normalizedCountry,
                    shedding: formData.shedding || undefined,
                    activity: formData.activity || undefined,
                    friendliness: formData.friendliness || undefined,
                    cleanliness: formData.cleanliness || undefined,
                    otherAnimalsAttitude: formData.otherAnimalsAttitude || undefined,
                    grooming: formData.grooming || undefined,
                    affection: formData.affection || undefined,
                    furType: formData.furType || undefined,
                    guardQualities: formData.guardQualities || undefined,
                    groomingNeeds: formData.groomingNeeds || undefined,
                    noise: formData.noise || undefined,
                    pros: prosArray.length > 0 ? JSON.stringify(prosArray) : undefined,
                    cons: consArray.length > 0 ? JSON.stringify(consArray) : undefined,
                    gallery: (formData.gallery && formData.gallery.length > 0) ? JSON.stringify(formData.gallery) : undefined
                };
            }
            
            if (editingBreed) {
                await adminAPI.updateBreed(editingBreed.id, breedData);
            } else {
                await adminAPI.addBreed(breedData);
            }
            await fetchBreeds();
            setShowForm(false);
            setEditingBreed(null);
            setPhotoPreview(null);
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Ошибка при сохранении породы');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBreed = async (breedId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту породу?')) {
            try {
                await adminAPI.deleteBreed(breedId);
                await fetchBreeds();
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Ошибка при удалении породы');
            }
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
                e.target.classList.add('filter-selected-photo');
            } else {
                formGroup.classList.remove('has-value');
                e.target.classList.remove('filter-selected-photo');
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


    const handleGalleryFilesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => {
                const newFiles = [...prev.galleryFiles, ...files];
                // Создаем превью для новых файлов
                const newPreviews = files.map(file => URL.createObjectURL(file));
                // Обновляем превью: сначала URL (если есть при редактировании), потом файлы
                const urlPreviews = (prev.gallery || []).map(url => 
                    url.startsWith('http') ? url : `http://localhost:5000${url}`
                );
                const existingFilePreviews = galleryPreviews.slice((prev.gallery || []).length);
                setGalleryPreviews([...urlPreviews, ...existingFilePreviews, ...newPreviews]);
                return { ...prev, galleryFiles: newFiles };
            });
            // Очищаем input
            e.target.value = '';
        }
    };

    const removeGalleryItem = (index) => {
        const gallery = formData.gallery || [];
        if (index < gallery.length) {
            // Удаляем URL (при редактировании)
            const newGallery = gallery.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, gallery: newGallery }));
            const urlPreviews = newGallery.map(url => 
                url.startsWith('http') ? url : `http://localhost:5000${url}`
            );
            const filePreviews = formData.galleryFiles.map(f => URL.createObjectURL(f));
            setGalleryPreviews([...urlPreviews, ...filePreviews]);
        } else {
            // Удаляем файл
            const fileIndex = index - gallery.length;
            const previewToRevoke = galleryPreviews[index];
            if (previewToRevoke && previewToRevoke.startsWith('blob:')) {
                URL.revokeObjectURL(previewToRevoke);
            }
            const newFiles = formData.galleryFiles.filter((_, i) => i !== fileIndex);
            setFormData(prev => {
                const urlPreviews = (prev.gallery || []).map(url => 
                    url.startsWith('http') ? url : `http://localhost:5000${url}`
                );
                const filePreviews = newFiles.map(f => URL.createObjectURL(f));
                setGalleryPreviews([...urlPreviews, ...filePreviews]);
                return { ...prev, galleryFiles: newFiles };
            });
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="breed-management">
            <div className="section-header">
                <button onClick={handleAddBreed} className="btn btn-primary">
                    Добавить породу
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="breed-filters">
                <div className="filter-group" data-label="Вид животного">
                    <select
                        value={selectedSpeciesId}
                        onChange={(e) => setSelectedSpeciesId(e.target.value)}
                        className={selectedSpeciesId ? 'filter-selected' : ''}
                        style={{
                            backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                            backgroundSize: '16px 16px',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center'
                        }}
                    >
                        <option value="">Все виды</option>
                        {species.map(specie => (
                            <option key={specie.id} value={specie.id}>
                                {specie.speciesname}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="breeds-grid">
                {filteredBreeds.map(breed => (
                    <div 
                        key={breed.id} 
                        className="breed-card"
                    >
                        <div className="breed-card-image">
                            <img src={breed.photo || '/default-breed.jpg'} alt={breed.name || breed.breedname} />
                            <div className="breed-card-title-overlay">
                                <h3 className="breed-card-title">{breed.name || breed.breedname}</h3>
                            </div>
                            
                            {/* Кнопки действий поверх фото в правом верхнем углу */}
                            <div className="breed-actions-overlay">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditBreed(breed);
                                    }}
                                    className="btn-icon-overlay edit-btn"
                                    title="Редактировать"
                                >
                                    <img src="/icons/edit.svg" alt="Редактировать" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBreed(breed.id);
                                    }}
                                    className="btn-icon-overlay delete-btn"
                                    title="Удалить"
                                >
                                    <img src="/icons/delete.svg" alt="Удалить" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content breed-form-modal">
                        <div className="modal-header">
                            <h2>{editingBreed ? 'Редактировать породу' : 'Добавить породу'}</h2>
                            <button onClick={handleFormClose} className="close-btn">&times;</button>
                        </div>
                        {error && (
                            <div className="error-message" style={{ margin: '0 20px 10px' }}>
                                {error}
                            </div>
                        )}
                        {(() => {
                            const selectedSpecies = species.find(s => s.id === parseInt(formData.speciesId));
                            const speciesName = selectedSpecies?.speciesname?.toLowerCase() || '';
                            const isCat = speciesName.includes('кошк') || speciesName.includes('cat');
                            const isDog = speciesName.includes('собак') || speciesName.includes('dog');
                            
                            return (
                        <form onSubmit={handleFormSubmit} className="breed-form">
                            <div className="form-section" style={{marginTop: 0}}>
                                <h3 style={{marginBottom: 10}}>Основная информация</h3>

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="name">Название породы *</label>
                                </div>

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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
                                        {species.map(specie => (
                                            <option key={specie.id} value={specie.id}>
                                                {specie.speciesname}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="speciesId">Вид животного *</label>
                                </div>

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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
                                    <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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
                                            <div style={{marginTop: '10px'}}>
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    style={{
                                                        maxWidth: '200px',
                                                        maxHeight: '200px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px'
                                                    }}
                                                    onError={() => setPhotoPreview(null)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : formData.photoSource === 'file' ? (
                                    <div className="form-group" style={{marginBottom: 10}}>
                                        <div className="avatar-upload">
                                            <input
                                                type="file"
                                                id="photoFile"
                                                name="photoFile"
                                                accept="image/*"
                                                onChange={handlePhotoFileChange}
                                                style={{display: 'none'}}
                                            />
                                            <div className="avatar-preview full-size">
                                                {photoPreview ? (
                                                    <div className="avatar-image full-size">
                                                        <img
                                                            src={photoPreview}
                                                            alt="Preview"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                        <button type="button" onClick={() => {
                                                            setFormData(prev => ({...prev, photoFile: null}));
                                                            setPhotoPreview(null);
                                                        }} className="remove-avatar">
                                                            <img src={`${process.env.PUBLIC_URL || ''}/icons/cross.svg`} alt="Удалить" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="avatar-placeholder" style={{background: 'none'}}>
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

                                <div className="form-row" style={{marginBottom: 10}}>
                                    <div className="form-group floating-label-group" style={{marginBottom: 0}}>
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

                                    <div className="form-group floating-label-group" style={{marginBottom: 0}}>
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
                                </div>

                                <div className="form-group floating-label-group" style={{marginBottom: 0}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 0}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 0}}>
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

                                <div className="form-group checkbox-group" style={{marginTop: 0, marginBottom: 10}}>
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

                                <h3 style={{marginBottom: 10}}>Характеристики породы</h3>

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <h3 style={{marginBottom: 10}}>Плюсы и минусы</h3>

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <div className="form-group floating-label-group" style={{marginBottom: 10}}>
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

                                <h3 style={{marginBottom: 10, paddingBottom: 0}}>Галерея фотографий</h3>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <div className="gallery-upload">
                                        <input
                                            type="file"
                                            id="galleryFiles"
                                            name="galleryFiles"
                                            accept="image/*"
                                            multiple
                                            onChange={handleGalleryFilesChange}
                                            style={{display: 'none'}}
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
                                    <div className="gallery-preview" style={{marginTop: 0}}>
                                        <p style={{marginBottom: '10px', fontWeight: 500}}>Предпросмотр
                                            ({galleryPreviews.length} фото):</p>
                                        <div className="gallery-grid" style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: '15px'
                                        }}>
                                            {galleryPreviews.map((preview, index) => {
                                                return (
                                                    <div key={index} className="gallery-item"
                                                         style={{position: 'relative', aspectRatio: '1'}}>
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
                                                                top: '8px !important',
                                                                right: '8px !important',
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
                                    {loading ? 'Сохранение...' : (editingBreed ? 'Обновить' : 'Добавить')}
                                </button>
                            </div>
                        </form>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BreedManagement;