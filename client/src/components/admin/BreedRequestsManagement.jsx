import React, { useState, useEffect } from 'react';
import { breedRequestsAPI, petsAPI } from '../../services/api';
import '../../styles/BreedRequestsManagement.css';
import '../../styles/FloatingLabels.css';

const RequestCard = ({ request, onStatusUpdate, species }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    
    // Инициализация классов has-value для полей с начальными значениями
    useEffect(() => {
        const formGroups = document.querySelectorAll(`.request-card-${request.id} .floating-label-group`);
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
    }, [request.id]);
    
    // Проверяем, нужно ли показывать кнопку расширения
    const descriptionLines = request.description ? request.description.split('\n').length : 0;
    const needsExpansion = descriptionLines > 5;
    const displayDescription = needsExpansion && !isDescriptionExpanded 
        ? request.description.split('\n').slice(0, 5).join('\n') + '...'
        : request.description;
    
    const selectedSpecies = species.find(s => s.id === request.speciesid);
    const speciesName = selectedSpecies?.speciesname?.toLowerCase() || '';
    const isCat = speciesName.includes('кошк') || speciesName.includes('cat');
    const isDog = speciesName.includes('собак') || speciesName.includes('dog');
    
    // Функция для получения текста размера
    const getSizeText = (size) => {
        const sizeMap = {
            'small': 'Маленький',
            'medium': 'Средний',
            'large': 'Крупный'
        };
        return sizeMap[size] || size;
    };
    
    return (
        <div className={`request-card request-card-${request.id}`} style={{ position: 'relative' }}>
            <div className="request-header">
                <h3>{request.breedname}</h3>
                {getStatusBadge(request.status || 'pending')}
            </div>
            
            {(request.status || 'pending') === 'pending' && (
                <div className="request-actions-overlay">
                    <button
                        onClick={() => onStatusUpdate(request.id, 'approved')}
                        className="btn-icon-overlay approve-btn"
                        title="Одобрить"
                    >
                        <img src="/icons/tick.svg" alt="Одобрить" />
                    </button>
                    <button
                        onClick={() => onStatusUpdate(request.id, 'rejected')}
                        className="btn-icon-overlay reject-btn"
                        title="Отклонить"
                    >
                        <img src="/icons/cross.svg" alt="Отклонить" />
                    </button>
                </div>
            )}

            <div className="request-form-readonly">
                <div className="form-group floating-label-group" style={{ marginBottom: 30 }}>
                    <input
                        type="text"
                        id={`username-${request.id}`}
                        value={request.user?.username || 'Неизвестно'}
                        placeholder=" "
                        disabled
                        readOnly
                    />
                    <label htmlFor={`username-${request.id}`}>Пользователь</label>
                </div>
                
                <div className="form-group floating-label-group" style={{ marginBottom: 30 }}>
                    <input
                        type="text"
                        id={`breedName-${request.id}`}
                        value={request.breedname || ''}
                        placeholder=" "
                        disabled
                        readOnly
                    />
                    <label htmlFor={`breedName-${request.id}`}>Название породы *</label>
                </div>
                
                <div className="form-group floating-label-group" style={{ marginBottom: 30 }}>
                    <select
                        id={`speciesId-${request.id}`}
                        value={request.speciesid?.toString() || ''}
                        disabled
                        className={request.speciesid ? 'filter-selected' : ''}
                        style={{
                            backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                            backgroundSize: '16px 16px',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                            borderColor: '#e1e5e9'
                        }}
                    >
                        <option value="">Выберите вид</option>
                        {species.map(specie => (
                            <option key={specie.id} value={specie.id}>
                                {specie.speciesname || specie.name}
                            </option>
                        ))}
                    </select>
                    <label htmlFor={`speciesId-${request.id}`}>Вид животного *</label>
                </div>
                
                {request.shortdescription && (
                    <div className="form-group floating-label-group" style={{ marginBottom: 10 }}>
                        <textarea
                            id={`shortDescription-${request.id}`}
                            value={request.shortdescription || ''}
                            rows="2"
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`shortDescription-${request.id}`}>Краткое описание</label>
                    </div>
                )}
                
                <div className="form-group floating-label-group" style={{ marginBottom: 30 }}>
                    <textarea
                        id={`description-${request.id}`}
                        value={displayDescription || ''}
                        rows={needsExpansion && !isDescriptionExpanded ? 5 : Math.max(4, descriptionLines)}
                        placeholder=" "
                        disabled
                        readOnly
                    />
                    <label htmlFor={`description-${request.id}`}>Полное описание *</label>
                    {needsExpansion && (
                        <button
                            type="button"
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="expand-description-btn"
                            style={{ marginTop: '8px' }}
                        >
                            {isDescriptionExpanded ? 'Свернуть' : 'Развернуть'}
                        </button>
                    )}
                </div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: 30 }}>
                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            id={`weight-${request.id}`}
                            value={request.weight || ''}
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`weight-${request.id}`}>Вес *</label>
                    </div>
                    
                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            id={`height-${request.id}`}
                            value={request.height || ''}
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`height-${request.id}`}>Рост *</label>
                    </div>
                    
                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                        <select
                            id={`size-${request.id}`}
                            value={request.size || ''}
                            disabled
                            className={request.size ? 'filter-selected' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                borderColor: '#e1e5e9'
                            }}
                        >
                            <option value="">Выберите размер</option>
                            <option value="small">Маленький</option>
                            <option value="medium">Средний</option>
                            <option value="large">Крупный</option>
                        </select>
                        <label htmlFor={`size-${request.id}`}>Размер *</label>
                    </div>
                </div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: 25 }}>
                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            id={`lifespan-${request.id}`}
                            value={request.lifespan || ''}
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`lifespan-${request.id}`}>Продолжительность жизни *</label>
                    </div>
                    
                    <div className="form-group floating-label-group" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            id={`countryOfOrigin-${request.id}`}
                            value={request.countryoforigin || ''}
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`countryOfOrigin-${request.id}`}>Страна происхождения *</label>
                    </div>
                </div>
                
                <div className="form-group checkbox-group" style={{ marginTop: 0, marginBottom: 30 }}>
                    <label className="checkbox-label-styled" style={{ cursor: 'default' }}>
                        <input
                            type="checkbox"
                            checked={request.hypoallergenicity || false}
                            disabled
                            readOnly
                        />
                        <span className="checkbox-custom"></span>
                        Гипоаллергенная порода
                    </label>
                </div>
                
                {request.pros && (
                    <div className="form-group floating-label-group" style={{ marginBottom: 30 }}>
                        <textarea
                            id={`pros-${request.id}`}
                            value={Array.isArray(request.pros) ? request.pros.join('\n') : 
                                   typeof request.pros === 'string' ? (() => {
                                       try {
                                           const parsed = JSON.parse(request.pros);
                                           return Array.isArray(parsed) ? parsed.join('\n') : request.pros;
                                       } catch {
                                           return request.pros;
                                       }
                                   })() : request.pros || ''}
                            rows="2"
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`pros-${request.id}`}>Плюсы породы</label>
                    </div>
                )}
                
                {request.cons && (
                    <div className="form-group floating-label-group" style={{ marginBottom: 25 }}>
                        <textarea
                            id={`cons-${request.id}`}
                            value={Array.isArray(request.cons) ? request.cons.join('\n') : 
                                   typeof request.cons === 'string' ? (() => {
                                       try {
                                           const parsed = JSON.parse(request.cons);
                                           return Array.isArray(parsed) ? parsed.join('\n') : request.cons;
                                       } catch {
                                           return request.cons;
                                       }
                                   })() : request.cons || ''}
                            rows="2"
                            placeholder=" "
                            disabled
                            readOnly
                        />
                        <label htmlFor={`cons-${request.id}`}>Минусы породы</label>
                    </div>
                )}
            </div>

            {request.photo && (
                <div className="request-photo" style={{ marginBottom: 57 }}>
                    <img src={request.photo.startsWith('http') ? request.photo : `http://localhost:5000${request.photo}`} alt={request.breedname} />
                </div>
            )}
        </div>
    );
};

const getStatusBadge = (status) => {
    const statusConfig = {
        pending: { class: 'pending', label: 'Ожидает рассмотрения' },
        approved: { class: 'approved', label: 'Одобрено' },
        rejected: { class: 'rejected', label: 'Отклонено' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
};

const BreedRequestsManagement = () => {
    const [requests, setRequests] = useState([]);
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
        fetchSpecies();
    }, []);

    const fetchSpecies = async () => {
        try {
            const data = await petsAPI.getSpecies();
            setSpecies(data || []);
        } catch (error) {
            console.error('Error fetching species:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            console.log('Fetching breed requests...');
            const data = await breedRequestsAPI.getRequests();
            console.log('Breed requests data received:', data);
            // Дополнительная фильтрация: исключаем одобренные и отклоненные заявки (на случай, если они все же придут)
            const filteredData = data.filter(request => request.status !== 'approved' && request.status !== 'rejected');
            setRequests(filteredData);
        } catch (error) {
            console.error('Error fetching breed requests:', error);
            setError(`Ошибка при загрузке заявок: ${error.message || error.response?.data?.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (requestId, status) => {
        try {
            setError(''); // Очищаем предыдущие ошибки
            const response = await breedRequestsAPI.updateRequestStatus(requestId, status);
            console.log('Ответ от сервера при обновлении статуса:', response);
            
            if (status === 'approved') {
                console.log('✅ Заявка одобрена, порода добавлена в каталог');
            }
            
            await fetchRequests();
        } catch (error) {
            console.error('Ошибка при обновлении статуса заявки:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Ошибка при обновлении статуса';
            setError(errorMessage);
        }
    };

    if (loading) return <div className="loading">Загрузка заявок...</div>;

    return (
        <div className="breed-requests-management">
            {error && <div className="error-message">{error}</div>}
            <div className="requests-list">
                {requests.length === 0 ? (
                    <div className="empty-state" style={{marginTop: 0, height: '100%', padding: '85px 0'}}>
                        <h3>Заявки не найдены</h3>
                        <p style={{marginBottom: 0}}>Нет ожидающих рассмотрения заявок</p>
                    </div>
                ) : (
                    requests.map(request => (
                        <RequestCard 
                            key={request.id} 
                            request={request} 
                            species={species}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default BreedRequestsManagement;
