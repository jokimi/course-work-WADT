import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ArticleForm from '../components/articles/ArticleForm';
import '../styles/ArticleDetailsPage.css';

const ArticleDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteForm, setShowDeleteForm] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchArticle();
        checkIfSaved();
        fetchCategories();
    }, [id]);

    const fetchArticle = async () => {
        try {
            const data = await articlesAPI.getArticleById(id);
            setArticle(data);
        } catch (error) {
            setError('Ошибка при загрузке статьи');
        } finally {
            setLoading(false);
        }
    };

    const checkIfSaved = async () => {
        if (!currentUser) return;

        try {
            const savedArticles = await articlesAPI.getSavedArticles();
            const saved = savedArticles.some(savedArticle =>
                savedArticle.article.id === parseInt(id)
            );
            setIsSaved(saved);
        } catch (error) {
            console.error('Error checking saved status:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await articlesAPI.getArticleCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleEditClick = () => {
        setShowEditForm(true);
    };

    const handleFormClose = () => {
        setShowEditForm(false);
    };

    const handleFormSubmit = async (articleData) => {
        try {
            await articlesAPI.updateArticle(article.id, articleData);
            await fetchArticle();
            setShowEditForm(false);
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при обновлении статьи');
        }
    };

    const handleSaveArticle = async () => {
        if (!currentUser) return;

        try {
            if (isSaved) {
                await articlesAPI.unsaveArticle(article.id);
                setIsSaved(false);
            } else {
                await articlesAPI.saveArticle(article.id);
                setIsSaved(true);
            }
        } catch (error) {
            setError('Ошибка при сохранении статьи');
        }
    };

    const handleDeleteClick = () => {
        // Если админ удаляет чужую статью, показываем форму с причиной
        if (currentUser?.role === 'admin' && currentUser.id !== article.author.id) {
            setShowDeleteForm(true);
        } else {
            // Для автора - обычное подтверждение
            if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
                handleDeleteArticle();
            }
        }
    };

    const handleDeleteArticle = async (reason = null) => {
        try {
            console.log('Удаление статьи:', { articleId: article.id, reason });
            await articlesAPI.deleteArticle(article.id, reason);
            navigate('/articles');
        } catch (error) {
            console.error('Ошибка при удалении статьи:', error);
            const errorMessage = error.response?.data?.message || 'Ошибка при удалении статьи';
            setError(errorMessage);
            throw error; // Пробрасываем ошибку дальше
        }
    };

    const handleDeleteFormSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Очищаем предыдущие ошибки
        
        // Валидация: проверяем, что выбрана причина
        if (!deleteReason || deleteReason.trim() === '') {
            setError('Пожалуйста, выберите причину удаления');
            return;
        }
        
        // Если выбрана "Другая причина", проверяем, что указан текст
        if (deleteReason === 'Другая причина') {
            if (!customReason || !customReason.trim()) {
                setError('Пожалуйста, укажите причину удаления');
                return;
            }
        }
        
        const finalReason = deleteReason === 'Другая причина' ? customReason.trim() : deleteReason;
        
        try {
            await handleDeleteArticle(finalReason);
            // Закрываем форму только после успешного удаления
            setShowDeleteForm(false);
            setDeleteReason('');
            setCustomReason('');
            setError('');
        } catch (error) {
            // Ошибка уже обработана в handleDeleteArticle, форма остается открытой
            console.error('Ошибка при удалении статьи:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="loading">Загрузка статьи...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!article) return <div className="error">Статья не найдена</div>;

    // Only author can edit their article (admin cannot edit other users' articles)
    const canEdit = currentUser && currentUser.id === article.author.id;
    // Author can delete their article, admin can delete any article
    const canDelete = currentUser && (currentUser.id === article.author.id || currentUser.role === 'admin');

    return (
        <div className="article-details">
            <div className="container">
                <article className="article-content">
                    <header className="article-header">
                        <div className="article-meta">
                            <div className="categories-list-crumbs">
                                {(article.categories || (article.category ? [article.category] : [])).map((category, index) => (
                                    <span key={category.id || index} className="category">{category.name}</span>
                                ))}
                            </div>
                            <div className="date">{formatDate(article.createdat)}</div>
                        </div>

                        <h1 className="article-title">{article.title}</h1>

                        <div className="author-info-with-actions">
                            <div className="author-info">
                                <div className="author-avatar">
                                    {article.author.avatar ? (
                                        <img src={article.author.avatar.startsWith('http') 
                                            ? article.author.avatar 
                                            : `http://localhost:5000${article.author.avatar}`} 
                                            alt={article.author.name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {article.author.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="author-details">
                                    <span className="author-name">{article.author.name}</span>
                                    <span className="author-username">@{article.author.username}</span>
                                </div>
                            </div>
                            
                            <div className="article-actions-inline">
                                {currentUser && (
                                    <button
                                        onClick={handleSaveArticle}
                                        className="btn-icon-inline save-btn"
                                        title={isSaved ? "Удалить из избранного" : "Сохранить статью"}
                                    >
                                        <img 
                                            src={isSaved ? '/icons/unsave.svg' : '/icons/save.svg'} 
                                            alt={isSaved ? "Удалить из избранного" : "Сохранить статью"}
                                        />
                                    </button>
                                )}

                                {canEdit && (
                                    <button
                                        onClick={handleEditClick}
                                        className="btn-icon-inline edit-btn"
                                        title="Редактировать"
                                    >
                                        <img src="/icons/edit.svg" alt="Редактировать" />
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        onClick={handleDeleteClick}
                                        className="btn-icon-inline delete-btn"
                                        title="Удалить"
                                    >
                                        <img src="/icons/delete.svg" alt="Удалить" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>

                    {article.image && (
                        <div className="article-image" style={{ height: 450 }}>
                            <img src={article.image} alt={article.title} />
                        </div>
                    )}

                    <div className="article-body">
                        <div className="article-text">
                            {article.content.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </article>

                <div className="related-articles">
                    <h3>Читайте также</h3>
                    <div className="related-grid">
                        <div className="related-placeholder">
                            <p>Похожие статьи появятся здесь скоро</p>
                        </div>
                    </div>
                </div>

                {showEditForm && (
                    <ArticleForm
                        article={article}
                        categories={categories}
                        onSubmit={handleFormSubmit}
                        onClose={handleFormClose}
                    />
                )}

                {showDeleteForm && (
                    <div className="modal-overlay">
                        <div className="modal-content delete-article-modal">
                            <div className="modal-header">
                                <h2>Удаление статьи</h2>
                                <button onClick={() => setShowDeleteForm(false)} className="close-btn">&times;</button>
                            </div>
                            <form onSubmit={handleDeleteFormSubmit} className="delete-article-form">
                                <p>Вы собираетесь удалить статью пользователя <strong>{article.author.name}</strong>.</p>
                                <p>Пожалуйста, укажите причину удаления:</p>
                                
                                <div className="form-group">
                                    <label htmlFor="deleteReason">Причина удаления *</label>
                                    <select
                                        id="deleteReason"
                                        value={deleteReason}
                                        onChange={(e) => {
                                            setDeleteReason(e.target.value);
                                            setError(''); // Очищаем ошибку при выборе
                                            if (e.target.value !== 'Другая причина') {
                                                setCustomReason(''); // Очищаем кастомную причину
                                            }
                                        }}
                                        required
                                        className="form-select"
                                    >
                                        <option value="">Выберите причину</option>
                                        <option value="Нарушение правил сообщества">Нарушение правил сообщества</option>
                                        <option value="Некорректное содержание">Некорректное содержание</option>
                                        <option value="Спам">Спам</option>
                                        <option value="Плагиат">Плагиат</option>
                                        <option value="Другая причина">Другая причина</option>
                                    </select>
                                </div>

                                {deleteReason === 'Другая причина' && (
                                    <div className="form-group">
                                        <label htmlFor="customReason">Укажите причину *</label>
                                        <textarea
                                            id="customReason"
                                            value={customReason}
                                            onChange={(e) => {
                                                setCustomReason(e.target.value);
                                                setError(''); // Очищаем ошибку при вводе
                                            }}
                                            required={deleteReason === 'Другая причина'}
                                            rows="3"
                                            placeholder="Опишите причину удаления статьи"
                                        />
                                    </div>
                                )}

                                {error && <div className="error-message">{error}</div>}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteForm(false);
                                            setDeleteReason('');
                                            setCustomReason('');
                                            setError('');
                                        }}
                                        className="btn btn-outline"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-danger"
                                    >
                                        Удалить статью
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleDetailsPage;