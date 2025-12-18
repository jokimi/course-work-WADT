import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { petsAPI } from '../services/api';
import '../styles/BreedCatalog.css';
import '../styles/BreedCard.css';

const BreedCatalog = () => {
    const { speciesId } = useParams();
    const navigate = useNavigate();
    const [breeds, setBreeds] = useState([]);
    const [species, setSpecies] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        hypoallergenic: '',
        size: '',
        lifespan: ''
    });

    const getSizeTranslation = (size) => {
        const sizeMap = {
            'small': 'Маленький',
            'medium': 'Средний',
            'large': 'Крупный'
        };
        return sizeMap[size] || size;
    };

    useEffect(() => {
        fetchBreeds();
        fetchSpecies();
    }, [speciesId, filters]);

    const fetchSpecies = async () => {
        try {
            const allSpecies = await petsAPI.getSpecies();
            const currentSpecies = allSpecies.find(s => s.id === parseInt(speciesId));
            setSpecies(currentSpecies);
        } catch (error) {
            console.error('Error fetching species:', error);
        }
    };

    const fetchBreeds = async () => {
        try {
            const queryParams = { species: speciesId };

            if (filters.hypoallergenic) {
                queryParams.hypoallergenic = filters.hypoallergenic;
            }
            if (filters.size) {
                queryParams.size = filters.size;
            }
            if (filters.lifespan) {
                queryParams.lifespan = filters.lifespan;
            }

            const data = await petsAPI.getBreeds(queryParams);
            setBreeds(data.breeds || []);
        } catch (error) {
            setError('Ошибка при загрузке пород');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            hypoallergenic: '',
            size: '',
            lifespan: ''
        });
    };

    if (loading) return <div className="loading">Загрузка пород...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="breed-catalog">
            <div className="container">
                <div className="page-header">
                    <Link to="/pet-types" className="back-link">← Назад к типам животных</Link>
                    <h1>{species?.speciesname}: породы</h1>
                    {species?.description && (
                        <p>{species.description}</p>
                    )}
                </div>

                <div className="filters">
                    <div className="filter-group" data-label="Гипоаллергенность">
                        <select
                            value={filters.hypoallergenic}
                            onChange={(e) => handleFilterChange('hypoallergenic', e.target.value)}
                            className={filters.hypoallergenic ? 'filter-selected' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '11px 11px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Все</option>
                            <option value="true">Гипоаллергенные</option>
                            <option value="false">Не гипоаллергенные</option>
                        </select>
                    </div>

                    <div className="filter-group" data-label="Размер">
                        <select
                            value={filters.size}
                            onChange={(e) => handleFilterChange('size', e.target.value)}
                            className={filters.size ? 'filter-selected' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Все</option>
                            <option value="small">Маленький</option>
                            <option value="medium">Средний</option>
                            <option value="large">Крупный</option>
                        </select>
                    </div>

                    <div className="filter-group" data-label="Продолжительность жизни">
                        <select
                            value={filters.lifespan}
                            onChange={(e) => handleFilterChange('lifespan', e.target.value)}
                            className={filters.lifespan ? 'filter-selected' : ''}
                            style={{
                                backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                                backgroundSize: '16px 16px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center'
                            }}
                        >
                            <option value="">Все</option>
                            <option value="1-5">1-5 лет</option>
                            <option value="6-10">6-10 лет</option>
                            <option value="11-15">11-15 лет</option>
                            <option value="16+">16+ лет</option>
                        </select>
                    </div>

                    <button onClick={clearFilters} className="clear-filters">
                        Сбросить фильтры
                    </button>
                </div>

                <div className="breeds-grid">
                    {breeds.map((breed) => (
                        <div 
                            key={breed.id} 
                            className="breed-card"
                            onClick={() => navigate(`/breed/${breed.id}`)}
                        >
                            <div className="breed-card-image">
                                <img src={breed.photo || '/default-breed.jpg'} alt={breed.breedname} />
                                <div className="breed-card-title-overlay">
                                    <h3 className="breed-card-title">{breed.breedname}</h3>
                                </div>
                            </div>
                            <div className="breed-card-content">
                                <p className="breed-card-description">{breed.short_description || breed.description}</p>
                                <div className="breed-card-arrow">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {breeds.length === 0 && (
                    <div className="empty-state">
                        <h3>Породы не найдены</h3>
                        <p>Попробуйте изменить параметры фильтрации</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BreedCatalog;