import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetTypes from './pages/PetTypes';
import BreedCatalog from './pages/BreedCatalog';
import BreedDetails from './pages/BreedDetails';
import MyPets from './pages/MyPets';
import PetDetailsPage from './pages/PetDetailsPage';
import Articles from './pages/Articles';
import ArticleDetailsPage from './pages/ArticleDetailsPage';
import SavedArticles from './pages/SavedArticles';
import BreedRequest from './pages/BreedRequest';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Reminders from './pages/Reminders';
import './styles/App.css';

function AppContent() {
    const location = useLocation();
    const hideFooter = location.pathname === '/login' || location.pathname === '/register';

    return (
        <div className="App">
            <Header />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/pet-types" element={<ProtectedRoute><PetTypes /></ProtectedRoute>} />
                    <Route path="/breeds/:speciesId" element={<ProtectedRoute><BreedCatalog /></ProtectedRoute>} />
                    <Route path="/breed/:id" element={<ProtectedRoute><BreedDetails /></ProtectedRoute>} />
                    <Route path="/my-pets" element={<ProtectedRoute><MyPets /></ProtectedRoute>} />
                    <Route path="/pet/:id" element={<ProtectedRoute><PetDetailsPage /></ProtectedRoute>} />
                    <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
                    <Route path="/articles" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
                    <Route path="/article/:id" element={<ProtectedRoute><ArticleDetailsPage /></ProtectedRoute>} />
                    <Route path="/saved-articles" element={<ProtectedRoute><SavedArticles /></ProtectedRoute>} />
                    <Route path="/community" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
                    <Route path="/breed-request" element={<ProtectedRoute><BreedRequest /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Routes>
            </main>
            {!hideFooter && <Footer />}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;