import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { petsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/BreedReviews.css';

const BreedReviews = ({ breedId }) => {
    const { currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState('');
    const [reviewPhotos, setReviewPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [reactions, setReactions] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [reactionInput, setReactionInput] = useState('');
    const [imageModalUrl, setImageModalUrl] = useState(null);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editPhotos, setEditPhotos] = useState([]);
    const [showReviewMenu, setShowReviewMenu] = useState(null);
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const newSocket = io('http://localhost:5000', {
            auth: { token: token }
        });

        newSocket.on('connect', () => {
            console.log('Подключено к отзывам');
            newSocket.emit('join-breed-reviews', breedId);
        });

        newSocket.on('new-review', (review) => {
            setReviews(prev => [...prev, review]);
        });

        newSocket.on('review-updated', (updatedReview) => {
            setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
        });

        newSocket.on('review-deleted', (data) => {
            setReviews(prev => prev.filter(r => r.id !== data.reviewId));
        });

        newSocket.on('review-reaction-updated', (data) => {
            setReactions(prev => ({
                ...prev,
                [data.reviewId]: data.reactions
            }));
        });

        setSocket(newSocket);
        loadReviews();

        return () => {
            newSocket.emit('leave-breed-reviews', breedId);
            newSocket.disconnect();
        };
    }, [breedId, currentUser]);

    const loadReviews = async () => {
        try {
            const data = await petsAPI.getBreedReviews(breedId);
            setReviews(data);
            
            const reactionsData = {};
            for (const review of data) {
                try {
                    const reviewReactions = await petsAPI.getReviewReactions(review.id);
                    reactionsData[review.id] = reviewReactions;
                } catch (error) {
                    console.error(`Ошибка при загрузке реакций для отзыва ${review.id}:`, error);
                }
            }
            setReactions(reactionsData);
            
            setLoading(false);
        } catch (error) {
            console.error('Ошибка при загрузке отзывов:', error);
            setLoading(false);
        }
    };

    const handlePhotoChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            const uploadPromises = files.map(file => petsAPI.uploadFile(file));
            const uploadedFiles = await Promise.all(uploadPromises);
            setReviewPhotos(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
            console.error('Ошибка при загрузке фотографий:', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if ((!newReview.trim() && reviewPhotos.length === 0) || !socket) return;

        try {
            const photosJson = reviewPhotos.length > 0 ? JSON.stringify(reviewPhotos.map(p => p.url)) : null;
            socket.emit('create-review', {
                breedId: breedId,
                text: newReview.trim() || '',
                photos: photosJson
            });
            setNewReview('');
            setReviewPhotos([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Ошибка при отправке отзыва:', error);
        }
    };

    const handleToggleReaction = async (reviewId, reaction) => {
        if (!socket || !currentUser) return;

        try {
            socket.emit('toggle-review-reaction', {
                reviewId: reviewId,
                reaction: reaction
            });
            setShowReactionPicker(null);
            setReactionInput('');
        } catch (error) {
            console.error('Ошибка при отправке реакции:', error);
        }
    };

    const parsePhotos = (photosJson) => {
        if (!photosJson) return [];
        try {
            return JSON.parse(photosJson);
        } catch {
            return [];
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (seconds < 10) return 'только что';
        if (seconds < 60) return `${seconds} сек назад`;
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        if (days < 7) return `${days} дн назад`;
        
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const hasUserReacted = (reviewId, reaction) => {
        const reviewReactions = reactions[reviewId];
        if (!reviewReactions || !reviewReactions[reaction]) return false;
        return reviewReactions[reaction].some(user => user.id === currentUser?.id);
    };

    const hasUserReactedToMessage = (reviewId) => {
        const reviewReactions = reactions[reviewId];
        if (!reviewReactions) return false;
        return Object.values(reviewReactions).some(users => 
            users.some(user => user.id === currentUser?.id)
        );
    };

    const handleStartEdit = (review) => {
        setEditingReviewId(review.id);
        setEditText(review.text || '');
        const photosList = parsePhotos(review.photos);
        setEditPhotos(photosList.map(url => ({ url })));
        setShowReviewMenu(null);
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditText('');
        setEditPhotos([]);
    };

    const handleSaveEdit = async (reviewId) => {
        if ((!editText.trim() && editPhotos.length === 0) || !socket) return;

        try {
            const photosJson = editPhotos.length > 0 ? JSON.stringify(editPhotos.map(p => p.url)) : null;
            socket.emit('update-review', {
                reviewId: reviewId,
                text: editText.trim() || '',
                photos: photosJson
            });
            setEditingReviewId(null);
            setEditText('');
            setEditPhotos([]);
        } catch (error) {
            console.error('Ошибка при редактировании отзыва:', error);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
            return;
        }

        if (!socket) return;

        try {
            socket.emit('delete-review', {
                reviewId: reviewId,
            });
            setShowReviewMenu(null);
        } catch (error) {
            console.error('Ошибка при удалении отзыва:', error);
        }
    };

    const handleEditPhotoChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            const uploadPromises = files.map(file => petsAPI.uploadFile(file));
            const uploadedFiles = await Promise.all(uploadPromises);
            setEditPhotos(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
            console.error('Ошибка при загрузке фотографий:', error);
        }
    };

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showReviewMenu && !event.target.closest('.review-actions-wrapper')) {
                setShowReviewMenu(null);
            }
            if (showReactionPicker && !event.target.closest('.review-reaction-controls')) {
                setShowReactionPicker(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showReviewMenu, showReactionPicker]);

    if (loading) {
        return <div className="breed-reviews-loading">Загрузка отзывов...</div>;
    }

    return (
        <div className="breed-reviews">
            {currentUser ? (
                <form className="review-form" onSubmit={handleSubmitReview}>
                    <textarea
                        className="review-input"
                        placeholder="Напишите отзыв о породе..."
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        maxLength={2000}
                    />
                    <div className="review-form-actions">
                        <button
                            type="button"
                            className="attach-photos-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Добавить фото
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handlePhotoChange}
                        />
                        {reviewPhotos.length > 0 && (
                            <div className="review-photos-preview">
                                {reviewPhotos.map((photo, index) => (
                                    <div key={index} className="photo-preview">
                                        <img src={photo.url.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`} alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={() => setReviewPhotos(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="submit-review-btn"
                            disabled={(!newReview.trim() && reviewPhotos.length === 0) || !socket}
                        >
                            Отправить отзыв
                        </button>
                    </div>
                </form>
            ) : (
                <div className="review-login-prompt">
                    <p>Войдите, чтобы оставить отзыв</p>
                </div>
            )}

            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <div className="reviews-empty">
                        <p>Пока нет отзывов. Будьте первым!</p>
                    </div>
                ) : (
                    reviews.map((review) => {
                        const reviewPhotosList = parsePhotos(review.photos);
                        return (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <div className="review-author-info">
                                        <div className="review-avatar">
                                            {review.user.avatar ? (
                                                <img
                                                    src={review.user.avatar.startsWith('http') 
                                                        ? review.user.avatar 
                                                        : `http://localhost:5000${review.user.avatar}`}
                                                    alt={review.user.name}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {review.user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="review-author-details">
                                            <span className="review-author">{review.user.name}</span>
                                            <span className="review-time">{formatTime(review.createdat)}</span>
                                        </div>
                                    </div>
                                    {review.user.id === currentUser?.id && (
                                        <div className="review-actions-wrapper">
                                            <button
                                                className="review-menu-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowReviewMenu(showReviewMenu === review.id ? null : review.id);
                                                }}
                                                title="Меню отзыва"
                                            >
                                                ⋮
                                            </button>
                                            {showReviewMenu === review.id && (
                                                <div className="review-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                                    {editingReviewId === review.id ? (
                                                        <>
                                                            <button
                                                                className="review-menu-item"
                                                                onClick={() => {
                                                                    handleSaveEdit(review.id);
                                                                    setShowReviewMenu(null);
                                                                }}
                                                            >
                                                                ✓ Сохранить
                                                            </button>
                                                            <button
                                                                className="review-menu-item"
                                                                onClick={() => {
                                                                    handleCancelEdit();
                                                                    setShowReviewMenu(null);
                                                                }}
                                                            >
                                                                × Отмена
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="review-menu-item"
                                                                onClick={() => {
                                                                    handleStartEdit(review);
                                                                }}
                                                            >
                                                                Редактировать
                                                            </button>
                                                            <button
                                                                className="review-menu-item"
                                                                onClick={() => {
                                                                    handleDeleteReview(review.id);
                                                                }}
                                                            >
                                                                Удалить
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {editingReviewId === review.id ? (
                                    <>
                                        <textarea
                                            className="review-edit-input"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                    handleSaveEdit(review.id);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEdit();
                                                }
                                            }}
                                            maxLength={2000}
                                            autoFocus
                                        />
                                        <div className="review-form-actions">
                                            <button
                                                type="button"
                                                className="attach-photos-btn"
                                                onClick={() => editFileInputRef.current?.click()}
                                            >
                                                Добавить фото
                                            </button>
                                            <input
                                                ref={editFileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleEditPhotoChange}
                                            />
                                            {editPhotos.length > 0 && (
                                                <div className="review-photos-preview">
                                                    {editPhotos.map((photo, index) => (
                                                        <div key={index} className="photo-preview">
                                                            <img src={photo.url.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`} alt="Preview" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditPhotos(prev => prev.filter((_, i) => i !== index))}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {review.text && review.text.trim().length > 0 && (
                                            <div className="review-text">{review.text}</div>
                                        )}
                                    </>
                                )}
                                {editingReviewId !== review.id && reviewPhotosList.length > 0 && (
                                    <div className="review-photos">
                                        {reviewPhotosList.map((photoUrl, index) => (
                                            <img
                                                key={index}
                                                src={photoUrl.startsWith('http') ? photoUrl : `http://localhost:5000${photoUrl}`}
                                                alt={`Фото ${index + 1}`}
                                                onClick={() => setImageModalUrl(photoUrl.startsWith('http') ? photoUrl : `http://localhost:5000${photoUrl}`)}
                                            />
                                        ))}
                                    </div>
                                )}
                                {editingReviewId === review.id && editPhotos.length > 0 && (
                                    <div className="review-photos">
                                        {editPhotos.map((photo, index) => (
                                            <img
                                                key={index}
                                                src={photo.url.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`}
                                                alt={`Фото ${index + 1}`}
                                                onClick={() => setImageModalUrl(photo.url.startsWith('http') ? photo.url : `http://localhost:5000${photo.url}`)}
                                            />
                                        ))}
                                    </div>
                                )}
                                
                                {/* Реакции */}
                                <div className="review-footer">
                                    <div className="review-reactions-wrapper">
                                        {reactions[review.id] && Object.keys(reactions[review.id]).length > 0 && (
                                            <div className="review-reactions">
                                                {Object.entries(reactions[review.id]).map(([reaction, users]) => (
                                                    <button
                                                        key={reaction}
                                                        className="reaction-button-with-count"
                                                        onClick={() => handleToggleReaction(review.id, reaction)}
                                                        title={users.map(u => u.name).join(', ')}
                                                    >
                                                        {reaction.startsWith('data:image') || reaction.startsWith('http') ? (
                                                            <img src={reaction} alt="reaction" className="reaction-image" />
                                                        ) : (
                                                            <span className="reaction-emoji">{reaction}</span>
                                                        )}
                                                        <span className="reaction-count">{users.length}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Кнопка добавления реакции */}
                                        {currentUser && !hasUserReactedToMessage(review.id) && (
                                            <div className="review-reaction-controls">
                                                <button
                                                    className="add-reaction-btn-icon"
                                                    onClick={() => setShowReactionPicker(
                                                        showReactionPicker === review.id ? null : review.id
                                                    )}
                                                    title="Добавить реакцию"
                                                >
                                                    <img 
                                                        src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/reaction.svg` : '/icons/reaction.svg'} 
                                                        alt="Добавить реакцию" 
                                                        className="reaction-icon"
                                                    />
                                                </button>
                                                
                                                {showReactionPicker === review.id && (
                                                    <div className="reaction-picker">
                                                        <div className="reaction-picker-section">
                                                            <div className="quick-reactions">
                                                                {['👍', '👎', '❤️', '😂', '😊', '😮', '😱', '😢', '🎉', '🔥'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        className="quick-reaction-btn"
                                                                        onClick={() => handleToggleReaction(review.id, emoji)}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {imageModalUrl && (
                <div className="review-image-modal" onClick={() => setImageModalUrl(null)}>
                    <div className="review-image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="review-image-modal-close"
                            onClick={() => setImageModalUrl(null)}
                        >
                            ×
                        </button>
                        <img src={imageModalUrl} alt="Просмотр" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BreedReviews;

