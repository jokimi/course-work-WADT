import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/PetCard.css';

const PetCard = ({ pet, onEdit, onDelete }) => {
    const getAge = (birthday) => {
        const birthDate = new Date(birthday);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        return `${years} лет, ${months} месяцев`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    return (
        <div className="pet-card">
            <div className="pet-header">
                <div className="pet-avatar">
                    {pet.avatar ? (
                        <img src={pet.avatar} alt={pet.petname} />
                    ) : (
                        <div className="avatar-placeholder">
                            <span>🐾</span>
                        </div>
                    )}
                </div>
                <div className="pet-info-header">
                    <h3>{pet.petname}</h3>
                    <div className="pet-actions">
                        <button onClick={() => onEdit(pet)} className="btn-icon" title="Редактировать">
                            ✏️
                        </button>
                        <button onClick={() => onDelete(pet.id)} className="btn-icon" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            <div className="pet-info">
                <div className="pet-breed">
                    <strong>Порода:</strong> {pet.breed.breedname}
                </div>
                <div className="pet-age">
                    <strong>Возраст:</strong> {getAge(pet.birthday)}
                </div>
                <div className="pet-weight">
                    <strong>Вес:</strong> {parseFloat(pet.currentweight).toFixed(1)} кг
                </div>
                <div className="pet-gender">
                    <strong>Пол:</strong> {pet.gender ? 'Мужской' : 'Женский'}
                </div>
            </div>

            {pet.healthnotes && (
                <div className="pet-health">
                    <strong>Заметки о здоровье:</strong>
                    <p>{pet.healthnotes}</p>
                </div>
            )}

            <div className="pet-care">
                <div className="care-item">
                    <span>Последняя вакцинация:</span>
                    <span>{formatDate(pet.lastvaccinated)}</span>
                </div>
                <div className="care-item">
                    <span>Последний осмотр:</span>
                    <span>{formatDate(pet.lastinspected)}</span>
                </div>
                <div className="care-item">
                    <span>Последние лекарства/витамины:</span>
                    <span>{formatDate(pet.lastvitamins)}</span>
                </div>
            </div>

            <div className="pet-footer">
                <Link to={`/pet/${pet.id}`} className="btn btn-outline">
                    Подробнее
                </Link>
                <Link to={`/reminders?pet=${pet.id}`} className="btn btn-outline">
                    Напоминания
                </Link>
            </div>
        </div>
    );
};

export default PetCard;