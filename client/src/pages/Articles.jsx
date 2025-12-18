import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ArticleCard from '../components/articles/ArticleCard';
import ArticleForm from '../components/articles/ArticleForm';
import '../styles/Articles.css';
import '../styles/Community.css';

const Articles = () => {
    const { currentUser } = useAuth();
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [savedArticleIds, setSavedArticleIds] = useState(new Set());
    const [filters, setFilters] = useState({
        category: '',
        page: 1
    });

    useEffect(() => {
        fetchArticles();
        fetchCategories();
        if (currentUser) {
            fetchSavedArticles();
        }
    }, [filters, currentUser]);

    const fetchArticles = async () => {
        try {
            const data = await articlesAPI.getArticles(filters);
            setArticles(data.articles || []);
        } catch (error) {
            setError('Ошибка при загрузке статей');
        } finally {
            setLoading(false);
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

    const fetchSavedArticles = async () => {
        if (!currentUser) return;
        try {
            const data = await articlesAPI.getSavedArticles();
            const savedIds = new Set(data.map(savedArticle => savedArticle.article.id));
            setSavedArticleIds(savedIds);
        } catch (error) {
            console.error('Error fetching saved articles:', error);
        }
    };

    const handleAddArticle = () => {
        setEditingArticle(null);
        setShowForm(true);
    };

    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingArticle(null);
    };

    const handleFormSubmit = async (articleData) => {
        try {
            if (editingArticle) {
                await articlesAPI.updateArticle(editingArticle.id, articleData);
            } else {
                await articlesAPI.createArticle(articleData);
            }
            await fetchArticles();
            setShowForm(false);
            setEditingArticle(null);
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при сохранении статьи');
        }
    };

    const handleDeleteArticle = async (articleId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
            try {
                await articlesAPI.deleteArticle(articleId);
                await fetchArticles();
            } catch (error) {
                setError('Ошибка при удалении статьи');
            }
        }
    };

    const handleSaveArticle = async (articleId) => {
        try {
            await articlesAPI.saveArticle(articleId);
            setSavedArticleIds(prev => new Set([...prev, articleId]));
        } catch (error) {
            setError('Ошибка при сохранении статьи');
        }
    };

    const handleUnsaveArticle = async (articleId) => {
        try {
            await articlesAPI.unsaveArticle(articleId);
            setSavedArticleIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(articleId);
                return newSet;
            });
        } catch (error) {
            setError('Ошибка при удалении статьи из избранного');
        }
    };

    const handleFilterChange = (category) => {
        setFilters(prev => ({
            ...prev,
            category: category || '',
            page: 1
        }));
    };

    if (loading) return <div className="loading">Загрузка статей...</div>;

    return (
        <div className="articles">
            <div className="container">
                <div className="page-header">
                    <h1>Сообщество</h1>
                    <p>Полезные материалы по уходу, воспитанию и здоровью животных</p>
                    {currentUser && (
                        <button onClick={handleAddArticle} className="btn btn-primary">
                            Написать статью
                        </button>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="articles-filters filters">
                    <div className="filter-group" data-label="Категория">
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className={filters.category ? 'filter-selected' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Все категории</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="articles-grid">
                    {articles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            currentUser={currentUser}
                            onEdit={handleEditArticle}
                            onDelete={handleDeleteArticle}
                            onSave={handleSaveArticle}
                            onUnsave={handleUnsaveArticle}
                            isSaved={savedArticleIds.has(article.id)}
                        />
                    ))}
                </div>

                {articles.length === 0 && (
                    <div className="empty-state" style={{ marginTop: 0 }}>
                        <div className="empty-icon" style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                            <img src={`${process.env.PUBLIC_URL || ''}/icons/books.svg`} alt="Книги" style={{ width: '64px', height: '64px' }} />
                        </div>
                        <h3>Статьи не найдены</h3>
                        <p>Попробуйте изменить параметры фильтрации или создайте первую статью</p>
                        {currentUser && (
                            <button onClick={handleAddArticle} className="btn btn-primary">
                                Написать первую статью
                            </button>
                        )}
                    </div>
                )}

                {showForm && (
                    <ArticleForm
                        article={editingArticle}
                        categories={categories}
                        onSubmit={handleFormSubmit}
                        onClose={handleFormClose}
                    />
                )}
            </div>
        </div>
    );
};

export default Articles;