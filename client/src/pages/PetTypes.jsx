import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { petsAPI } from '../services/api';
import '../styles/PetTypes.css';

const PetTypes = () => {
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSpecies();
    }, []);

    const fetchSpecies = async () => {
        try {
            const data = await petsAPI.getSpecies();
            setSpecies(data);
        } catch (error) {
            setError('Ошибка при загрузке видов животных');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="pet-types">
            <div className="container">
                <div className="page-header" style={{ marginBottom: 30 }}>
                    <h1 style={{ marginBottom: 0 }}>Выберите тип животного</h1>
                </div>

                <div className="species-grid">
                    {species.map((specie) => (
                        <Link
                            key={specie.id}
                            to={`/breeds/${specie.id}`}
                            className="species-card" style={{ padding: 10 }}
                        >
                            <div className="species-icon-circle">
                                {specie.speciesicon ? (
                                    <img src={specie.speciesicon} alt={specie.speciesname} />
                                ) : (
                                    <img src={`${process.env.PUBLIC_URL || ''}/icons/paw-prints.svg`} alt={specie.speciesname} />
                                    )}
                            </div>
                            <div className="species-name">{specie.speciesname}</div>
                        </Link>
                    ))}
                </div>

                {species.length === 0 && (
                    <div className="empty-state">
                        <h3>Виды животных пока не добавлены</h3>
                        <p>Скоро здесь появятся различные типы домашних животных</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PetTypes;