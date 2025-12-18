import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ArticleCard from '../components/articles/ArticleCard';
import '../styles/SavedArticles.css';

const SavedArticles = () => {
    const { currentUser } = useAuth();
    const [savedArticles, setSavedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSavedArticles();
    }, []);

    const fetchSavedArticles = async () => {
        try {
            const data = await articlesAPI.getSavedArticles();
            setSavedArticles(data);
        } catch (error) {
            setError('Ошибка при загрузке сохраненных статей');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsaveArticle = async (articleId) => {
        try {
            await articlesAPI.unsaveArticle(articleId);
            await fetchSavedArticles();
        } catch (error) {
            setError('Ошибка при удалении статьи из сохраненных');
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="saved-articles">
            <div className="container">
                <div className="page-header">
                    <h1>Сохраненные статьи</h1>
                    <p>Статьи, которые вы сохранили для чтения позже</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {savedArticles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                            <img src={`${process.env.PUBLIC_URL || ''}/icons/books.svg`} alt="Книги" style={{ width: '64px', height: '64px' }} />
                        </div>
                        <h3>У вас нет сохраненных статей</h3>
                        <p>Сохраняйте интересные статьи, чтобы читать их позже</p>
                        <Link to="/articles" className="btn btn-primary">
                            Найти статьи
                        </Link>
                    </div>
                ) : (
                    <div className="saved-articles-grid">
                        {savedArticles.map((savedArticle) => (
                            <ArticleCard
                                key={savedArticle.article.id}
                                article={savedArticle.article}
                                currentUser={currentUser}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                onSave={async () => {}}
                                onUnsave={handleUnsaveArticle}
                                isSaved={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedArticles;