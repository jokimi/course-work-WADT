import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ArticleCard.css';

const ArticleCard = ({ article, currentUser, onEdit, onDelete, onSave, onUnsave, isSaved = false }) => {
    const [saved, setSaved] = useState(isSaved);

    useEffect(() => {
        setSaved(isSaved);
    }, [isSaved]);
    const isAuthor = currentUser && currentUser.id === article.author.id;
    // Only author can edit their article (admin cannot edit other users' articles)
    const canEdit = isAuthor;
    // Author can delete their article, admin can delete any article
    const canDelete = isAuthor || currentUser?.role === 'admin';

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSaveClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (saved) {
                // Если статья уже сохранена, удаляем из избранного
                if (onUnsave) {
                    await onUnsave(article.id);
                }
                setSaved(false);
            } else {
                // Если статья не сохранена, сохраняем
                if (onSave) {
                    await onSave(article.id);
                }
                setSaved(true);
            }
        } catch (error) {
            console.error('Ошибка при сохранении/удалении статьи:', error);
        }
    };

    const handleEditClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(article);
    };

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(article.id);
    };

    return (
        <div className="article-card">
            <Link to={`/article/${article.id}`} className="article-link">
                <div className="article-image" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                    <img
                        src={article.image || '/default-article.jpg'}
                        alt={article.title}
                    />
                    <div className="article-categories-overlay">
                        {(article.categories || (article.category ? [article.category] : [])).map((category, index) => (
                            <span key={category.id || index} className="article-category-badge">{category.name}</span>
                        ))}
                    </div>
                    
                    {/* Кнопки действий поверх фото в правом верхнем углу */}
                    <div className="article-actions-overlay">
                        {currentUser && (
                            <button
                                onClick={handleSaveClick}
                                className="btn-icon-overlay save-btn"
                                title={saved ? "Удалить из избранного" : "Сохранить статью"}
                            >
                                <img 
                                    src={saved ? '/icons/unsave.svg' : '/icons/save.svg'} 
                                    alt={saved ? "Удалить из избранного" : "Сохранить статью"}
                                />
                            </button>
                        )}

                        {canEdit && (
                            <button
                                onClick={handleEditClick}
                                className="btn-icon-overlay edit-btn"
                                title="Редактировать"
                            >
                                <img src="/icons/edit.svg" alt="Редактировать" />
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={handleDeleteClick}
                                className="btn-icon-overlay delete-btn"
                                title="Удалить"
                            >
                                <img src="/icons/delete.svg" alt="Удалить" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="article-content">
                    <div className="article-header-meta">
                        <div className="author-info">
                            <div className="author-avatar">
                                {article.author.avatar ? (
                                    <img 
                                        src={article.author.avatar.startsWith('http') 
                                            ? article.author.avatar 
                                            : `http://localhost:5000${article.author.avatar}`} 
                                        alt={article.author.name} 
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {article.author.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="author-name">{article.author.name}</span>
                        </div>
                        <span className="article-date">{formatDate(article.createdat)}</span>
                    </div>

                    <h3 className="article-title" style={{ margin: 0, fontSize: 30 }}>{article.title}</h3>
                </div>
            </Link>
        </div>
    );
};

export default ArticleCard;