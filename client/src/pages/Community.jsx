import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Community.css';

const Community = () => {
    const communityStats = {
        totalUsers: 1250,
        totalArticles: 543,
        totalPets: 890,
        activeMembers: 234
    };

    const features = [
        {
            icon: '👥',
            title: 'Сообщество владельцев',
            description: 'Общайтесь с другими владельцами питомцев, делитесь опытом и советами'
        },
        {
            icon: '💬',
            title: 'Обсуждения',
            description: 'Задавайте вопросы и получайте ответы от опытных владельцев'
        },
        {
            icon: '📊',
            title: 'Рейтинги и отзывы',
            description: 'Читайте отзывы о породах, кормах и ветеринарных клиниках'
        },
        {
            icon: '🎯',
            title: 'Экспертные советы',
            description: 'Получайте рекомендации от ветеринаров и профессиональных кинологов'
        }
    ];

    return (
        <div className="community">
            <div className="container">
                <div className="page-header">
                    <h1>Сообщество</h1>
                    <p>Присоединяйтесь к нашему сообществу любителей животных</p>
                </div>

                <section className="community-stats">
                    <h2>Наше сообщество в цифрах</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-number">{communityStats.totalUsers}+</div>
                            <div className="stat-label">Пользователей</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📚</div>
                            <div className="stat-number">{communityStats.totalArticles}+</div>
                            <div className="stat-label">Статей</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🐾</div>
                            <div className="stat-number">{communityStats.totalPets}+</div>
                            <div className="stat-label">Питомцев</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔥</div>
                            <div className="stat-number">{communityStats.activeMembers}</div>
                            <div className="stat-label">Активных участников</div>
                        </div>
                    </div>
                </section>

                <section className="community-features">
                    <h2>Возможности сообщества</h2>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="community-actions">
                    <h2>Присоединяйтесь к сообществу</h2>
                    <div className="action-cards">
                        <div className="action-card">
                            <h3>Читайте статьи</h3>
                            <p>Изучайте полезные материалы от опытных владельцев и экспертов</p>
                            <Link to="/articles" className="btn btn-primary">
                                Читать статьи
                            </Link>
                        </div>
                        <div className="action-card">
                            <h3>Делитесь опытом</h3>
                            <p>Напишите статью и помогите другим владельцам питомцев</p>
                            <Link to="/articles" className="btn btn-primary">
                                Написать статью
                            </Link>
                        </div>
                        <div className="action-card">
                            <h3>Расширяйте каталог</h3>
                            <p>Предложите новую породу для добавления в наш каталог</p>
                            <Link to="/breed-request" className="btn btn-primary">
                                Предложить породу
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="community-guidelines">
                    <h2>Правила сообщества</h2>
                    <div className="guidelines-list">
                        <div className="guideline">
                            <h4>🤝 Уважайте друг друга</h4>
                            <p>Будьте вежливы и уважительны ко всем участникам сообщества</p>
                        </div>
                        <div className="guideline">
                            <h4>📚 Делитесь знаниями</h4>
                            <p>Помогайте другим владельцам своим опытом и знаниями</p>
                        </div>
                        <div className="guideline">
                            <h4>🩺 Консультируйтесь с ветеринарами</h4>
                            <p>Помните, что советы в сообществе не заменяют консультацию специалиста</p>
                        </div>
                        <div className="guideline">
                            <h4>📷 Делитесь фото</h4>
                            <p>Показывайте своих питомцев и вдохновляйте других</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Community;