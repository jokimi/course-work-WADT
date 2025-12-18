import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
    const backgroundImages = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-collage">
                    <div className="hero-collage-wrapper">
                        {[...backgroundImages, ...backgroundImages].map((num, index) => (
                            <div key={index} className="hero-collage-item">
                                <img 
                                    src={`${process.env.PUBLIC_URL || ''}/background/${num}.jpg`}
                                    alt={`Background ${num}`}
                                    onError={(e) => {
                                        e.target.src = `${process.env.PUBLIC_URL || ''}/img/background/${num}.jpg`;
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="hero-overlay"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <h1>Pure Paw-some!</h1>
                        <p className="hero-subtitle">Ваш помощник в уходе за питомцами</p>
                        <p className="hero-description">
                            Управляйте здоровьем, напоминаниями и информацией о ваших питомцах в одном месте
                        </p>
                        <div className="hero-actions">
                            <Link to="/pet-types" className="btn btn-primary">Каталог пород</Link>
                            <Link to="/articles" className="btn btn-primary">Читать статьи</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="container">
                    <h2>Возможности</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon" style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                                <img src={`${process.env.PUBLIC_URL || ''}/icons/breeds.svg`} alt="Каталог пород" style={{ width: '64px', height: '64px' }} />
                            </div>
                            <h3>Каталог пород</h3>
                            <p>Полная информация о различных породах домашних животных</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                                <img src={`${process.env.PUBLIC_URL || ''}/icons/notes.svg`} alt="Управление питомцами" style={{ width: '64px', height: '64px' }} />
                            </div>
                            <h3>Управление питомцами</h3>
                            <p>Создавайте карточки питомцев и отслеживайте их здоровье</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                                <img src={`${process.env.PUBLIC_URL || ''}/icons/reminders.svg`} alt="Напоминания" style={{ width: '64px', height: '64px' }} />
                            </div>
                            <h3>Напоминания</h3>
                            <p>Не пропускайте важные события по уходу за питомцами</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon" style={{filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(5000%) hue-rotate(210deg) brightness(0.7)'}}>
                                <img src={`${process.env.PUBLIC_URL || ''}/icons/books.svg`} alt="База знаний" style={{ width: '64px', height: '64px' }} />
                            </div>
                            <h3>База знаний</h3>
                            <p>Полезные статьи и советы по уходу за питомцами от опытных владельцев</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;