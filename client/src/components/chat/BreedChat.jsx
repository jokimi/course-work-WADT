import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/BreedChat.css';
import '../../styles/BreedChatOwnMessage.css';
import '../../styles/BreedChatOtherMessage.css';

const BreedChat = ({ breedId }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [reactions, setReactions] = useState({}); // { messageId: { reaction: [users] } }
    const [showReactionPicker, setShowReactionPicker] = useState(null); // messageId
    const [reactionInput, setReactionInput] = useState(''); // URL или эмодзи
    const [imageModalUrl, setImageModalUrl] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null); // ID сообщения в режиме редактирования
    const [editText, setEditText] = useState(''); // Текст редактируемого сообщения
    const [showMessageMenu, setShowMessageMenu] = useState(null); // messageId для показа меню
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const timeUpdateIntervalRef = useRef(null);

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMessageMenu && !event.target.closest('.message-actions-wrapper-inline') && !event.target.closest('.message-menu-dropdown')) {
                setShowMessageMenu(null);
            }
            if (showReactionPicker && !event.target.closest('.message-reaction-controls') && !event.target.closest('.reaction-picker')) {
                setShowReactionPicker(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMessageMenu, showReactionPicker]);

    useEffect(() => {
        if (!currentUser) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Подключаемся к Socket.IO
        const newSocket = io('http://localhost:5000', {
            auth: {
                token: token
            }
        });

        newSocket.on('connect', () => {
            console.log('Подключено к чату');
            newSocket.emit('join-breed-chat', breedId);
        });

        newSocket.on('new-message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('reaction-updated', (data) => {
            setReactions(prev => ({
                ...prev,
                [data.messageId]: data.reactions
            }));
        });

        newSocket.on('message-updated', (updatedMessage) => {
            setMessages(prev => prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
            ));
        });

        newSocket.on('message-deleted', (data) => {
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        });

        newSocket.on('error', (error) => {
            console.error('Ошибка Socket.IO:', error);
        });

        setSocket(newSocket);

        // Загружаем историю сообщений
        loadMessages();

        // Запускаем обновление времени каждую минуту
        timeUpdateIntervalRef.current = setInterval(() => {
            setMessages(prev => [...prev]); // Триггерим ре-рендер для обновления времени
        }, 60000); // Каждую минуту

        return () => {
            newSocket.emit('leave-breed-chat', breedId);
            newSocket.disconnect();
            if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
            }
        };
    }, [breedId, currentUser]);

    const loadMessages = async () => {
        try {
            const data = await chatAPI.getBreedChatMessages(breedId, 50);
            setMessages(data);
            
            // Загружаем реакции для всех сообщений
            const reactionsData = {};
            for (const message of data) {
                try {
                    const messageReactions = await chatAPI.getMessageReactions(message.id);
                    reactionsData[message.id] = messageReactions;
                } catch (error) {
                    console.error(`Ошибка при загрузке реакций для сообщения ${message.id}:`, error);
                }
            }
            setReactions(reactionsData);
            
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Ошибка при загрузке сообщений:', error);
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || !socket) return;

        try {
            socket.emit('send-message', {
                breedId: breedId,
                message: newMessage.trim() || '',
                attachments: attachments,
            });
            setNewMessage('');
            setAttachments([]);
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
        }
    };

    const handleAttachmentChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const availableSlots = 3 - attachments.length;
        if (availableSlots <= 0) {
            return;
        }

        const filesToUpload = files.slice(0, availableSlots);

        try {
            const uploaded = [];
            for (const file of filesToUpload) {
                const data = await chatAPI.uploadFile(file);
                uploaded.push(data);
            }
            setAttachments(prev => [...prev, ...uploaded]);
        } catch (error) {
            console.error('Ошибка при загрузке вложения:', error);
        } finally {
            e.target.value = '';
        }
    };

    const handleToggleReaction = async (messageId, reaction) => {
        if (!socket || !currentUser) return;

        try {
            socket.emit('toggle-reaction', {
                messageId: messageId,
                reaction: reaction
            });
            setShowReactionPicker(null);
            setReactionInput('');
        } catch (error) {
            console.error('Ошибка при отправке реакции:', error);
        }
    };

    const handleAddReaction = (messageId) => {
        if (!reactionInput.trim()) return;
        handleToggleReaction(messageId, reactionInput.trim());
    };

    const handleReactionFileChange = (e, messageId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleToggleReaction(messageId, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartEdit = (message) => {
        setEditingMessageId(message.id);
        setEditText(message.message || '');
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditText('');
    };

    const handleSaveEdit = async (messageId) => {
        if (!editText.trim() || !socket) return;

        try {
            socket.emit('update-message', {
                messageId: messageId,
                message: editText.trim(),
            });
            setEditingMessageId(null);
            setEditText('');
        } catch (error) {
            console.error('Ошибка при редактировании сообщения:', error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
            return;
        }

        if (!socket) return;

        try {
            socket.emit('delete-message', {
                messageId: messageId,
            });
        } catch (error) {
            console.error('Ошибка при удалении сообщения:', error);
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

    const hasUserReacted = (messageId, reaction) => {
        const messageReactions = reactions[messageId];
        if (!messageReactions || !messageReactions[reaction]) return false;
        return messageReactions[reaction].some(user => user.id === currentUser?.id);
    };

    const hasUserReactedToMessage = (messageId) => {
        const messageReactions = reactions[messageId];
        if (!messageReactions) return false;
        return Object.values(messageReactions).some(users => 
            users.some(user => user.id === currentUser?.id)
        );
    };

    if (loading) {
        return <div className="breed-chat-loading">Загрузка чата...</div>;
    }

    return (
        <div className="breed-chat">
            <div className="breed-chat-header">
                <h3>💬 Чат владельцев породы</h3>
                <p>Общайтесь с другими владельцами питомцев этой породы</p>
            </div>

            <div className="breed-chat-messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="breed-chat-empty">
                        <p>Пока нет сообщений. Будьте первым!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`breed-chat-message ${
                                message.user.id === currentUser?.id ? 'own-message' : 'other-message'
                            }`}
                        >
                            <div className="message-avatar">
                                {message.user.avatar ? (
                                    <img
                                        src={message.user.avatar.startsWith('http') 
                                            ? message.user.avatar 
                                            : `http://localhost:5000${message.user.avatar}`}
                                        alt={message.user.name}
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {message.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="message-content">
                                {/* Первая строка: имя слева, для своих - троеточие справа */}
                                <div className="message-header">
                                    <div className="message-header-left">
                                        <span className="message-author">{message.user.name}</span>
                                    </div>
                                    {message.user.id === currentUser?.id && (
                                        <div className="message-actions-wrapper-inline">
                                            <button
                                                className="message-menu-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMessageMenu(showMessageMenu === message.id ? null : message.id);
                                                }}
                                                title="Меню сообщения"
                                            >
                                                ⋮
                                            </button>
                                            {showMessageMenu === message.id && (
                                                <div className="message-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                                    {editingMessageId === message.id ? (
                                                        <>
                                                            <button
                                                                className="message-menu-item"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleSaveEdit(message.id);
                                                                    setShowMessageMenu(null);
                                                                }}
                                                            >
                                                                Сохранить
                                                            </button>
                                                            <button
                                                                className="message-menu-item"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleCancelEdit();
                                                                    setShowMessageMenu(null);
                                                                }}
                                                            >
                                                                Отмена
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="message-menu-item"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleStartEdit(message);
                                                                    setShowMessageMenu(null);
                                                                }}
                                                            >
                                                                Редактировать
                                                            </button>
                                                            <button
                                                                className="message-menu-item"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDeleteMessage(message.id);
                                                                    setShowMessageMenu(null);
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
                                
                                {/* Вторая строка: сообщение */}
                                <div className="message-body">
                                    {editingMessageId === message.id ? (
                                        <textarea
                                            className="message-edit-input"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                    handleSaveEdit(message.id);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEdit();
                                                }
                                            }}
                                            maxLength={1000}
                                            autoFocus
                                        />
                                    ) : (
                                        message.message && message.message.trim().length > 0 && (
                                            <div className="message-text">{message.message}</div>
                                        )
                                    )}
                                </div>

                                {/* Третья строка: фото (если есть) */}
                                {(() => {
                                    let messageAttachments = [];
                                    if (message.attachments) {
                                        try {
                                            const parsed = typeof message.attachments === 'string'
                                                ? JSON.parse(message.attachments)
                                                : message.attachments;
                                            if (Array.isArray(parsed)) {
                                                messageAttachments = parsed;
                                            }
                                        } catch (err) {
                                            console.error('Ошибка парсинга вложений сообщения:', err);
                                        }
                                    } else if (message.attachment_url) {
                                        messageAttachments = [{
                                            url: message.attachment_url,
                                            name: message.attachment_name,
                                            mimeType: message.attachment_type,
                                            size: message.attachment_size,
                                        }];
                                    }

                                    return messageAttachments.length > 0 ? (
                                        <div className="message-attachments">
                                            {messageAttachments.slice(0, 3).map((att, index) => {
                                                const url = att.url?.startsWith('http')
                                                    ? att.url
                                                    : `http://localhost:5000${att.url}`;
                                                const isImage = att.mimeType?.startsWith('image/') || att.isImage;

                                                return isImage ? (
                                                    <div
                                                        key={index}
                                                        className="message-attachment image-attachment"
                                                        onClick={() => setImageModalUrl(url)}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={att.name || 'Изображение'}
                                                        />
                                                    </div>
                                                ) : (
                                                    <a
                                                        key={index}
                                                        className="message-attachment file-attachment"
                                                        href={url}
                                                        download={att.name || 'document'}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        📄 {att.name || 'Документ'}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : null;
                                })()}
                            
                                {/* Четвертая строка: реакции */}
                                <div className="message-footer">
                                    <div className="message-reactions-wrapper">
                                        {reactions[message.id] && Object.keys(reactions[message.id]).length > 0 && (
                                            <div className="message-reactions">
                                                {Object.entries(reactions[message.id]).map(([reaction, users]) => (
                                                    <button
                                                        key={reaction}
                                                        className="reaction-button-with-count"
                                                        onClick={() => handleToggleReaction(message.id, reaction)}
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

                                        {/* Реакции и кнопка добавления */}
                                        {currentUser && !hasUserReactedToMessage(message.id) && (
                                            <div className="message-reaction-controls">
                                                <button
                                                    className="add-reaction-btn-icon"
                                                    onClick={() => setShowReactionPicker(
                                                        showReactionPicker === message.id ? null : message.id
                                                    )}
                                                    title="Добавить реакцию"
                                                >
                                                    <img 
                                                        src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/reaction.svg` : '/icons/reaction.svg'} 
                                                        alt="Добавить реакцию" 
                                                        className="reaction-icon"
                                                    />
                                                </button>
                                                
                                                {showReactionPicker === message.id && (
                                                    <div className="reaction-picker">
                                                        <div className="reaction-picker-section">
                                                            <div className="quick-reactions">
                                                                {['👍', '👎', '❤️', '😂', '😊', '😮', '😱', '😢', '🎉', '🔥'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        className="quick-reaction-btn"
                                                                        onClick={() => handleToggleReaction(message.id, emoji)}
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
                                    <span className="message-time">{formatTime(message.createdat)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {currentUser ? (
                <form className="breed-chat-input-form" onSubmit={handleSendMessage}>
                    <button
                        type="button"
                        className="breed-chat-attach-btn"
                        onClick={() => document.getElementById('breed-chat-file-input').click()}
                        title="Прикрепить файлы (до 3 штук)"
                    >
                        <img src="/icons/paperclip.svg" alt="Прикрепить" className="attach-icon" />
                    </button>
                    <input
                        id="breed-chat-file-input"
                        type="file"
                        style={{ display: 'none' }}
                        multiple
                        onChange={handleAttachmentChange}
                    />
                    {attachments.length > 0 && (
                        <div className="breed-chat-attachment-preview">
                            {attachments.map((att, index) => (
                                <span key={index} className="breed-chat-attachment-chip">
                                    {att.name}
                                </span>
                            ))}
                            <button type="button" onClick={() => setAttachments([])}>
                                ×
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        className="breed-chat-input"
                        placeholder="Напишите сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        maxLength={1000}
                    />
                    <button
                        type="submit"
                        className="breed-chat-send-btn"
                        disabled={(!newMessage.trim() && attachments.length === 0) || !socket}
                    >
                        Отправить
                    </button>
                </form>
            ) : (
                <div className="breed-chat-login-prompt">
                    <p>Войдите, чтобы участвовать в чате</p>
                </div>
            )}

            {imageModalUrl && (
                <div className="chat-image-modal" onClick={() => setImageModalUrl(null)}>
                    <div className="chat-image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="chat-image-modal-close"
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

export default BreedChat;
