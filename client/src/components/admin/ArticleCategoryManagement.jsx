import React, { useState, useEffect } from 'react';
import { adminAPI, articlesAPI } from '../../services/api';
import '../../styles/ArticleCategoryManagement.css';

const ArticleCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await articlesAPI.getArticleCategories();
            setCategories(data);
        } catch (error) {
            setError('Ошибка при загрузке категорий');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = () => {
        setEditingCategory(null);
        setFormData({ name: '' });
        setShowForm(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || category.categoryname
        });
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingCategory(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim()) {
            setError('Заполните название категории');
            return;
        }
        setLoading(true);

        try {
            const payload = { name: formData.name.trim() };
            if (editingCategory) {
                await adminAPI.updateArticleCategory(editingCategory.id, payload);
            } else {
                await adminAPI.addArticleCategory(payload);
            }
            await fetchCategories();
            setShowForm(false);
            setEditingCategory(null);
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Ошибка при сохранении категории');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
            try {
                await adminAPI.deleteArticleCategory(categoryId);
                await fetchCategories();
            } catch (error) {
                setError(error.response?.data?.message || error.message || 'Ошибка при удалении категории');
            }
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="article-category-management">
            <div className="section-header">
                <button onClick={handleAddCategory} className="btn btn-primary">
                    Добавить категорию
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="categories-list">
                {categories.map(category => (
                    <div key={category.id} className="category-card" style={{ position: 'relative' }}>
                        <div className="category-info">
                            <h3>{category.name || category.categoryname}</h3>
                        </div>
                        <div className="category-actions-overlay">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCategory(category);
                                }}
                                className="btn-icon-overlay edit-btn"
                                title="Редактировать"
                            >
                                <img src="/icons/edit.svg" alt="Редактировать" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                }}
                                className="btn-icon-overlay delete-btn"
                                title="Удалить"
                            >
                                <img src="/icons/delete.svg" alt="Удалить" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
                            <button onClick={handleFormClose} className="close-btn">&times;</button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="category-form">
                            <div className="form-group">
                                <label htmlFor="name">Название категории *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    required
                                    placeholder="Введите название категории статьи"
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
                                    {loading ? 'Сохранение...' : (editingCategory ? 'Обновить' : 'Добавить')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleCategoryManagement;