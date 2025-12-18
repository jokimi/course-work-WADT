import React, { useState, useEffect } from 'react';
import '../../styles/ArticleForm.css';
import '../../styles/FloatingLabels.css';

const ArticleForm = ({ article, categories, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categoryIds: [],
        image: '',
        imageFile: null,
        imageSource: '' // 'url' or 'file'
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (article) {
            const categoryIds = article.categories 
                ? article.categories.map(cat => cat.id.toString())
                : (article.category ? [article.category.id.toString()] : []);
            
            setFormData({
                title: article.title,
                content: article.content,
                categoryIds: categoryIds,
                image: article.image || '',
                imageFile: null,
                imageSource: article.image ? (article.image.startsWith('http') ? 'url' : 'file') : ''
            });
            if (article.image) {
                setImagePreview(article.image.startsWith('http') ? article.image : `http://localhost:5000${article.image}`);
            }
        }
    }, [article]);

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

    const handleImageSourceChange = (e) => {
        setFormData(prev => ({
            ...prev,
            imageSource: e.target.value,
            image: '',
            imageFile: null
        }));
        setImagePreview(null);
        
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

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                imageFile: file
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUrlChange = (e) => {
        setFormData(prev => ({
            ...prev,
            image: e.target.value
        }));
        if (e.target.value) {
            setImagePreview(e.target.value);
        } else {
            setImagePreview(null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.title.trim() || !formData.content.trim() || formData.categoryIds.length === 0) {
            setError('Пожалуйста, заполните все обязательные поля');
            setLoading(false);
            return;
        }

        try {
            let articleData;
            if (formData.imageSource === 'file' && formData.imageFile) {
                // Если загружается файл, используем FormData
                const formDataToSend = new FormData();
                formDataToSend.append('title', formData.title);
                formDataToSend.append('content', formData.content);
                formData.categoryIds.forEach(categoryId => {
                    formDataToSend.append('categoryIds[]', categoryId);
                });
                formDataToSend.append('imageFile', formData.imageFile);
                articleData = formDataToSend;
            } else {
                // Если используется URL, отправляем обычный объект
                articleData = {
                    title: formData.title,
                    content: formData.content,
                    categoryIds: formData.categoryIds,
                    image: formData.image || null
                };
            }
            await onSubmit(articleData);
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при сохранении статьи');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content article-form-modal">
                <div className="modal-header">
                    <h2>{article ? 'Редактировать статью' : 'Написать статью'}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="article-form">
                    <div className="form-group floating-label-group">
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder=" "
                            required
                        />
                        <label htmlFor="title">Заголовок *</label>
                    </div>

                    <div className="form-group">
                        <label className="categories-label">Категории *</label>
                        <div className="categories-checkbox-group">
                            {categories.map(category => (
                                <label key={category.id} className="checkbox-label-styled">
                                    <input
                                        type="checkbox"
                                        name="categoryIds"
                                        value={category.id}
                                        checked={formData.categoryIds.includes(category.id.toString())}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData(prev => {
                                                const newCategoryIds = e.target.checked
                                                    ? [...prev.categoryIds, value]
                                                    : prev.categoryIds.filter(id => id !== value);
                                                return {
                                                    ...prev,
                                                    categoryIds: newCategoryIds
                                                };
                                            });
                                        }}
                                    />
                                    <span className="checkbox-custom"></span>
                                    {category.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group floating-label-group">
                        <select
                            id="imageSource"
                            name="imageSource"
                            value={formData.imageSource || ''}
                            onChange={handleImageSourceChange}
                            className={formData.imageSource ? 'filter-selected' : ''}
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
                        <label htmlFor="imageSource">Источник фото</label>
                    </div>

                    {formData.imageSource === 'url' ? (
                        <div className="form-group floating-label-group">
                            <input
                                type="url"
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleImageUrlChange}
                                placeholder=" "
                            />
                            <label htmlFor="image">URL изображения</label>
                            {imagePreview && (
                                <div style={{ marginTop: '10px' }}>
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                        onError={() => setImagePreview(null)}
                                    />
                                </div>
                            )}
                        </div>
                    ) : formData.imageSource === 'file' ? (
                        <div className="form-group">
                            <div className="avatar-upload">
                                <input
                                    type="file"
                                    id="imageFile"
                                    name="imageFile"
                                    accept="image/*"
                                    onChange={handleImageFileChange}
                                    style={{ display: 'none' }}
                                />
                                <div className="avatar-preview full-size">
                                    {imagePreview ? (
                                        <div className="avatar-image full-size">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                            <button type="button" onClick={() => {
                                                setFormData(prev => ({ ...prev, imageFile: null }));
                                                setImagePreview(null);
                                            }} className="remove-avatar">×</button>
                                        </div>
                                    ) : (
                                        <div className="avatar-placeholder" style={{ height: 'fit-content' }}>
                                            <p>Фото не выбрано</p>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => document.getElementById('imageFile').click()}
                                    className="btn btn-outline"
                                >
                                    {imagePreview ? 'Изменить фото' : 'Выбрать фото'}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="form-group floating-label-group">
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows="12"
                            placeholder=" "
                            required
                        />
                        <label htmlFor="content">Содержание *</label>
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
                            {loading ? 'Сохранение...' : (article ? 'Обновить' : 'Опубликовать')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArticleForm;