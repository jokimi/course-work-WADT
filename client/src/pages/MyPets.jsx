import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { petsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PetCard from '../components/pets/PetCard';
import PetForm from '../components/pets/PetForm';
import '../styles/MyPets.css';
import '../styles/PetTypes.css';

const MyPets = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [prefillBreed, setPrefillBreed] = useState(null);

    useEffect(() => {
        fetchPets();
        
        // Проверяем, есть ли предзаполнение из location.state
        if (location.state?.prefillForm && location.state?.selectedBreed) {
            setPrefillBreed(location.state.selectedBreed);
            setShowForm(true);
            // Очищаем state после использования
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const fetchPets = async () => {
        try {
            const data = await petsAPI.getMyPets();
            setPets(data);
        } catch (error) {
            setError('Ошибка при загрузке питомцев');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPet = () => {
        setEditingPet(null);
        setShowForm(true);
    };

    const handleEditPet = (pet) => {
        setEditingPet(pet);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingPet(null);
    };

    const handleFormSubmit = async (petData) => {
        try {
            if (editingPet) {
                await petsAPI.updatePet(editingPet.id, petData);
            } else {
                await petsAPI.addPet(petData);
            }
            await fetchPets();
            setShowForm(false);
            setEditingPet(null);
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка при сохранении питомца');
        }
    };

    const handleDeletePet = async (petId) => {
        if (window.confirm('Вы уверены, что хотите удалить этого питомца?')) {
            try {
                await petsAPI.deletePet(petId);
                await fetchPets();
            } catch (error) {
                setError('Ошибка при удалении питомца');
            }
        }
    };

    if (loading) return <div className="loading">Загрузка питомцев...</div>;

    return (
        <div className="my-pets">
            <div className="container">
                <div className="page-header">
                    <h1>Мои питомцы</h1>
                    <p>Управляйте информацией о ваших питомцах</p>
                    <button onClick={handleAddPet} className="btn btn-primary">
                        Добавить питомца
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {pets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <img src={`${process.env.PUBLIC_URL || ''}/icons/paw-prints.png`} alt="Paw prints" style={{ width: '64px', height: '64px' }} />
                        </div>
                        <h3>У вас пока нет питомцев</h3>
                        <p>Добавьте первого питомца, чтобы начать отслеживать его здоровье и уход</p>
                        <button onClick={handleAddPet} className="btn btn-primary">
                            Добавить первого питомца
                        </button>
                    </div>
                ) : (
                    <div className="pets-grid species-grid">
                        {pets.map((pet) => (
                            <Link
                                key={pet.id}
                                to={`/pet/${pet.id}`}
                                className="species-card"
                            >
                                <div 
                                    className="species-icon-circle"
                                    style={{
                                        backgroundImage: pet.avatar 
                                            ? `url(${pet.avatar.startsWith('http') ? pet.avatar : `http://localhost:5000${pet.avatar}`})`
                                            : `url(${process.env.PUBLIC_URL || ''}/icons/paw-prints.png)`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        width: 250,
                                        height: 250
                                    }}
                                >
                                </div>
                                <div className="species-name">{pet.petname}</div>
                            </Link>
                        ))}
                    </div>
                )}

                {showForm && (
                    <PetForm
                        pet={editingPet}
                        prefillBreed={prefillBreed}
                        onSubmit={handleFormSubmit}
                        onClose={handleFormClose}
                    />
                )}
            </div>
        </div>
    );
};

export default MyPets;