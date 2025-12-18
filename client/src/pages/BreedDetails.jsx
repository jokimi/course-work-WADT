import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { petsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BreedChat from '../components/chat/BreedChat';
import BreedReviews from '../components/breeds/BreedReviews';
import '../styles/BreedDetails.css';

const BreedDetails = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [breed, setBreed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [galleryModalImage, setGalleryModalImage] = useState(null);
    const [galleryModalIndex, setGalleryModalIndex] = useState(null);
    const [expandedSections, setExpandedSections] = useState(new Set());

    const getSizeTranslation = (size) => {
        const sizeMap = {
            'small': 'Маленький',
            'medium': 'Средний',
            'large': 'Крупный'
        };
        return sizeMap[size] || size;
    };

    const renderPaws = (level) => {
        const paws = [];
        const maxLevel = 5;
        const filledLevel = Math.min(level || 0, maxLevel);
        const pawIconPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/paw.svg` : '/icons/paw.svg';
        
        for (let i = 1; i <= maxLevel; i++) {
            paws.push(
                <span 
                    key={i} 
                    className={`paw ${i <= filledLevel ? 'filled' : ''}`}
                >
                    <img src={pawIconPath} alt="paw" className="paw-icon" />
                </span>
            );
        }
        return paws;
    };

    useEffect(() => {
        fetchBreed();
    }, [id]);

    const fetchBreed = async () => {
        try {
            const data = await petsAPI.getBreedById(id);
            setBreed(data);
        } catch (error) {
            setError('Ошибка при загрузке информации о породе');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPet = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        // Передаем breed в состояние для предзаполнения формы
        navigate('/my-pets', { 
            state: { 
                selectedBreed: breed,
                prefillForm: true 
            } 
        });
    };

    const parseGallery = (galleryJson) => {
        if (!galleryJson) return [];
        try {
            return JSON.parse(galleryJson);
        } catch {
            return [];
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const formatDescription = (text) => {
        if (!text) return '';
        
        const sections = [];
        const headRegex = /<head>(.*?)<\/head>/gi;
        
        // Находим все подзаголовки
        const matches = [];
        let match;
        while ((match = headRegex.exec(text)) !== null) {
            matches.push({
                index: match.index,
                endIndex: match.index + match[0].length,
                title: match[1]
            });
        }
        
        // Если нет подзаголовков, обрабатываем весь текст как абзацы
        if (matches.length === 0) {
            const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
            if (paragraphs.length === 0) {
                paragraphs.push(text);
            }
            return paragraphs.map((para, paraIdx) => {
                const lines = para.trim().split('\n').filter(line => line.length > 0);
                const content = lines.map((line, lineIndex) => {
                    if (lineIndex < lines.length - 1) {
                        return <React.Fragment key={lineIndex}>{line}<br />\n</React.Fragment>;
                    }
                    return line;
                });
                return (
                    <p key={paraIdx} className="breed-description-paragraph">
                        {content}
                    </p>
                );
            });
        }
        
        let sectionIndex = 0;
        let currentIndex = 0;
        
        // Обрабатываем текст до первого подзаголовка
        if (matches[0].index > currentIndex) {
            const beforeText = text.substring(currentIndex, matches[0].index);
            const paragraphs = beforeText.split(/\n\n+/).filter(p => p.trim().length > 0);
            if (paragraphs.length > 0) {
                sections.push({
                    type: 'paragraphs',
                    paragraphs: paragraphs
                });
            }
        }
        
        // Обрабатываем каждый подзаголовок и его содержимое
        matches.forEach((headMatch, idx) => {
            const startIndex = headMatch.endIndex;
            const endIndex = idx < matches.length - 1 ? matches[idx + 1].index : text.length;
            const sectionText = text.substring(startIndex, endIndex);
            const paragraphs = sectionText.split(/\n\n+/).filter(p => p.trim().length > 0);
            
            sections.push({
                type: 'subtitle',
                title: headMatch.title,
                paragraphs: paragraphs,
                sectionId: sectionIndex++
            });
        });
        
        return sections.map((section, sectionIdx) => {
            if (section.type === 'subtitle') {
                const isExpanded = expandedSections.has(section.sectionId);
                return (
                    <div key={`section-${section.sectionId}`} className="description-section">
                        <h3 
                            className="description-subtitle collapsible"
                            onClick={() => toggleSection(section.sectionId)}
                        >
                            <span className="subtitle-text">{section.title}</span>
                            <span className={`subtitle-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                        </h3>
                        {isExpanded && (
                            <div className="description-section-content">
                                {section.paragraphs.map((para, paraIdx) => {
                                    const lines = para.trim().split('\n').filter(line => line.length > 0);
                                    const content = lines.map((line, lineIndex) => {
                                        if (lineIndex < lines.length - 1) {
                                            return <React.Fragment key={lineIndex}>{line}<br /></React.Fragment>;
                                        }
                                        return line;
                                    });
                                    return (
                                        <p key={`para-${section.sectionId}-${paraIdx}`} className="breed-description-paragraph">
                                            {content}
                                        </p>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            } else {
                // Обычные абзацы без подзаголовка
                return section.paragraphs.map((para, paraIdx) => {
                    const lines = para.trim().split('\n').filter(line => line.length > 0);
                    const content = lines.map((line, lineIndex) => {
                        if (lineIndex < lines.length - 1) {
                            return <React.Fragment key={lineIndex}>{line}<br /></React.Fragment>;
                        }
                        return line;
                    });
                    return (
                        <p key={`para-section-${sectionIdx}-${paraIdx}`} className="breed-description-paragraph">
                            {content}
                        </p>
                    );
                });
            }
        });
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!breed) return <div className="error">Порода не найдена</div>;

    const galleryImages = parseGallery(breed.gallery);

    return (
        <div className="breed-details">
            <div className="container">
                <div className="breadcrumb">
                    <Link to="/pet-types">Типы животных</Link>
                    <span style={{}}> / </span>
                    <Link to={`/breeds/${breed.species.id}`}>{breed.species.speciesname}</Link>
                    <span> / </span>
                    <span>{breed.breedname}</span>
                </div>

                <div className="breed-header">
                    <div className="breed-image-wrapper">
                        <div className="breed-image">
                            <img src={breed.photo || '/default-breed.jpg'} alt={breed.breedname} />
                            {breed.hypoallergenicity && (
                                <div className="hypoallergenic-badge">
                                    <span className="hypoallergenic-text">Гипоаллергенная</span>
                                    <span className="hypoallergenic-check">
                                        <img src="/icons/tick.svg" alt="✓" className="hypoallergenic-check-icon" />
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="breed-info">
                        <h1>{breed.breedname}</h1>
                        
                        {/* Краткое описание */}
                        {breed.short_description && (
                            <p className="breed-short-description">{breed.short_description}</p>
                        )}

                        {/* Основные характеристики */}
                        <div className="breed-main-characteristics">
                            {breed.height && (
                                <div className="characteristic-line">
                                    <span className="char-label">Рост:</span>
                                    <span className="char-value">{breed.height.includes('см') ? breed.height : `${breed.height} см`}</span>
                                </div>
                            )}
                            {breed.weight && (
                                <div className="characteristic-line">
                                    <span className="char-label">Вес:</span>
                                    <span className="char-value">
                                        {breed.weight.includes('кг') 
                                            ? (breed.weight.includes('от') || breed.weight.includes('до') ? breed.weight : `${breed.weight}`)
                                            : (breed.weight.includes('от') || breed.weight.includes('до') ? `${breed.weight} кг` : `${breed.weight} кг`)
                                        }
                                    </span>
                                </div>
                            )}
                            {breed.lifespan && (
                                <div className="characteristic-line">
                                    <span className="char-label">Продолжительность жизни:</span>
                                    <span className="char-value">{breed.lifespan.includes('лет') ? breed.lifespan : `${breed.lifespan} лет`}</span>
                                </div>
                            )}
                            {breed.countryoforigin && (
                                <div className="characteristic-line">
                                    <span className="char-label">Страна происхождения:</span>
                                    <span className="char-value">{breed.countryoforigin}</span>
                                </div>
                            )}
                            {breed.fur_type && (
                                <div className="characteristic-line">
                                    <span className="char-label">Тип шерсти:</span>
                                    <span className="char-value">{breed.fur_type}</span>
                                </div>
                            )}
                        </div>

                        <button onClick={handleAddPet} className="btn btn-primary">
                            Добавить питомца этой породы
                        </button>
                    </div>
                </div>

                {/* Закладки */}
                <div className="breed-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Информация
                    </button>
                    {galleryImages.length > 0 && (
                        <button 
                            className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                            onClick={() => setActiveTab('gallery')}
                        >
                            Галерея
                        </button>
                    )}
                    <button 
                        className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Отзывы
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Чат владельцев
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'gallery' && (
                        <div className="gallery-tab-content">
                            <div className="breed-details-section">
                                <h2>Галерея фотографий</h2>
                                <div className="breed-gallery">
                                    {galleryImages.map((imageUrl, index) => (
                                        <div 
                                            key={index} 
                                            className="gallery-item"
                                            onClick={() => {
                                                setGalleryModalImage(
                                                    imageUrl.startsWith('http') 
                                                        ? imageUrl 
                                                        : `http://localhost:5000${imageUrl}`
                                                );
                                                setGalleryModalIndex(index);
                                            }}
                                        >
                                            <img 
                                                src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`} 
                                                alt={`${breed.breedname} ${index + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="info-tab-content" style={{ paddingTop: 0 }}>
                            {/* Плюсы и минусы после описания */}
                            {(() => {
                                const parseList = (value) => {
                                    if (!value) return [];
                                    if (Array.isArray(value)) return value;
                                    try {
                                        const parsed = JSON.parse(value);
                                        if (Array.isArray(parsed)) {
                                            return parsed;
                                        }
                                    } catch (e) {
                                        // не JSON — падаем в резервный вариант
                                    }
                                    return String(value)
                                        .split(/[\n;]+/)
                                        .map(item => item.trim())
                                        .filter(item => item.length > 0);
                                };

                                const prosList = parseList(breed.pros);
                                const consList = parseList(breed.cons);

                                if (prosList.length === 0 && consList.length === 0) {
                                    return null;
                                }

                                return (
                                    <div className="breed-details-section" style={{ marginTop: 0 }}>
                                        <div className="pros-cons">
                                            {prosList.length > 0 && (
                                                <div className="pros">
                                                    <h3 style={{ color: '#28a745', fontFamily: 'Circe', paddingTop: 8 }}>Плюсы:</h3>
                                                    <ul>
                                                        {prosList.map((item, index) => {
                                                            const pawIconPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/paw.svg` : '/icons/paw.svg';
                                                            return (
                                                                <li 
                                                                    key={index}
                                                                    style={{
                                                                        backgroundImage: `url(${pawIconPath})`,
                                                                        backgroundSize: '15px 15px',
                                                                        backgroundRepeat: 'no-repeat',
                                                                        backgroundPosition: 'left center',
                                                                        filter: '#28a745'
                                                                    }}
                                                                >
                                                                    {item}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                            {consList.length > 0 && (
                                                <div className="cons">
                                                    <h3 style={{ color: '#dc3545', fontFamily: 'Circe', paddingTop: 8 }}>Минусы:</h3>
                                                    <ul>
                                                        {consList.map((item, index) => {
                                                            const pawIconPath = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/icons/paw.svg` : '/icons/paw.svg';
                                                            return (
                                                                <li 
                                                                    key={index}
                                                                    style={{
                                                                        backgroundImage: `url(${pawIconPath})`,
                                                                        backgroundSize: '16px 16px',
                                                                        backgroundRepeat: 'no-repeat',
                                                                        backgroundPosition: 'left center',
                                                                        filter: '#dc3545'
                                                                    }}
                                                                >
                                                                    {item}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                            {((breed.trainability && breed.trainability > 0) || 
                              (breed.shedding && breed.shedding > 0) || 
                              (breed.activity && breed.activity > 0) || 
                              (breed.friendliness && breed.friendliness > 0 && breed.species?.speciesname?.toLowerCase().includes('кошк')) ||
                              (breed.grooming && breed.grooming > 0) || 
                              (breed.affection && breed.affection > 0) ||
                              (breed.guard_qualities && breed.guard_qualities > 0) ||
                              (breed.grooming_needs && breed.grooming_needs > 0) ||
                              (breed.noise && breed.noise > 0)) && (
                                <div className="breed-details-section">
                                    <h2>Характеристики породы</h2>
                                    <div className="characteristics-grid">
                                        {breed.trainability && breed.trainability > 0 && (
                                            <div className="characteristic">
                                                <h4>Дрессируемость</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.trainability)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.shedding && breed.shedding > 0 && (
                                            <div className="characteristic">
                                                <h4>Линька</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.shedding)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.activity && breed.activity > 0 && (
                                            <div className="characteristic">
                                                <h4>Активность</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.activity)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.friendliness && breed.friendliness > 0 && breed.species?.speciesname?.toLowerCase().includes('кошк') && (
                                            <div className="characteristic">
                                                <h4>Дружелюбность</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.friendliness)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.grooming && breed.grooming > 0 && (
                                            <div className="characteristic">
                                                <h4>Потребность в уходе</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.grooming)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.affection && breed.affection > 0 && (
                                            <div className="characteristic">
                                                <h4>Ласковость</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.affection)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.guard_qualities && breed.guard_qualities > 0 && (
                                            <div className="characteristic">
                                                <h4>Охранные качества</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.guard_qualities)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.grooming_needs && breed.grooming_needs > 0 && (
                                            <div className="characteristic">
                                                <h4>Потребность в вычесывании</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.grooming_needs)}
                                                </div>
                                            </div>
                                        )}
                                        {breed.noise && breed.noise > 0 && (
                                            <div className="characteristic">
                                                <h4>Шум</h4>
                                                <div className="paw-rating">
                                                    {renderPaws(breed.noise)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Полное описание под доп. характеристиками */}
                            {breed.description && (
                                <div className="breed-details-section">
                                    <h2>Описание породы</h2>
                                    <div className="breed-description">
                                        {formatDescription(breed.description)}
                                    </div>
                                </div>
                            )}

                            {/* Интересные факты после описания */}
                            {breed.interesting_facts && (
                                <div className="breed-details-section">
                                    <h2>Интересные факты</h2>
                                    <p className="interesting-facts">{breed.interesting_facts}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <BreedReviews breedId={id} />
                    )}

                    {activeTab === 'chat' && (
                        <BreedChat breedId={id} />
                    )}
                </div>

            {galleryModalImage && galleryModalIndex !== null && (
                <div className="chat-image-modal" onClick={() => {
                    setGalleryModalImage(null);
                    setGalleryModalIndex(null);
                }}>
                    <div className="chat-image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="chat-image-modal-close"
                            onClick={() => {
                                setGalleryModalImage(null);
                                setGalleryModalIndex(null);
                            }}
                        >
                            <img src={`${process.env.PUBLIC_URL || ''}/icons/cross.svg`} alt="Закрыть" style={{ width: '20px', height: '20px' }} />
                        </button>
                        {galleryModalIndex > 0 && (
                            <button
                                className="gallery-modal-nav gallery-modal-nav-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const prevIndex = galleryModalIndex - 1;
                                    const prevUrl = galleryImages[prevIndex];
                                    setGalleryModalImage(
                                        prevUrl.startsWith('http') 
                                            ? prevUrl 
                                            : `http://localhost:5000${prevUrl}`
                                    );
                                    setGalleryModalIndex(prevIndex);
                                }}
                            >
                                <img src={`${process.env.PUBLIC_URL || ''}/icons/left.svg`} alt="Назад" style={{ width: '24px', height: '24px' }} />
                            </button>
                        )}
                        {galleryModalIndex < galleryImages.length - 1 && (
                            <button
                                className="gallery-modal-nav gallery-modal-nav-right"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIndex = galleryModalIndex + 1;
                                    const nextUrl = galleryImages[nextIndex];
                                    setGalleryModalImage(
                                        nextUrl.startsWith('http') 
                                            ? nextUrl 
                                            : `http://localhost:5000${nextUrl}`
                                    );
                                    setGalleryModalIndex(nextIndex);
                                }}
                            >
                                <img src={`${process.env.PUBLIC_URL || ''}/icons/right.svg`} alt="Вперед" style={{ width: '24px', height: '24px' }} />
                            </button>
                        )}
                        <img src={galleryModalImage} alt={breed.breedname} />
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default BreedDetails;
