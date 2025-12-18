import React, { useState } from 'react';
import SpeciesManagement from '../components/admin/SpeciesManagement';
import BreedManagement from '../components/admin/BreedManagement';
import ArticleCategoryManagement from '../components/admin/ArticleCategoryManagement';
import BreedRequestsManagement from '../components/admin/BreedRequestsManagement';
import ReminderTypeManagement from '../components/admin/ReminderTypeManagement';
import '../styles/Admin.css';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('breed-requests');

    const tabs = [
        { id: 'breed-requests', name: 'Заявки на породы', icon: 'requests.svg' },
        { id: 'species', name: 'Виды животных', icon: 'paw-outlined.svg' },
        { id: 'breeds', name: 'Породы', icon: 'breeds.svg' },
        { id: 'article-categories', name: 'Категории статей', icon: 'books.svg' },
        { id: 'reminder-types', name: 'Типы напоминаний', icon: 'reminders.svg' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'species':
                return <SpeciesManagement />;
            case 'breeds':
                return <BreedManagement />;
            case 'article-categories':
                return <ArticleCategoryManagement />;
            case 'reminder-types':
                return <ReminderTypeManagement />;
            case 'breed-requests':
            default:
                return <BreedRequestsManagement />;
        }
    };

    return (
        <div className="admin">
            <div className="container">
                <div className="page-header">
                    <h1>Панель управления</h1>
                    <p>Управление контентом и модерация</p>
                </div>

                <div className="admin-layout">
                    <nav className="admin-sidebar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="tab-icon">
                                    <img 
                                        src={`${process.env.PUBLIC_URL || ''}/icons/${tab.icon}`} 
                                        alt={tab.name}
                                        className={activeTab === tab.id ? 'tab-icon-active' : ''}
                                    />
                                </span>
                                <span className="tab-name">{tab.name}</span>
                            </button>
                        ))}
                    </nav>

                    <main className="admin-content">
                        {renderTabContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Admin;