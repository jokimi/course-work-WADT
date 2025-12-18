import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Добавляем токен в заголовки автоматически
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Обрабатываем ошибки авторизации
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) =>
        api.post('/auth/login', { email, password }).then(res => res.data),

    register: (userData) =>
        api.post('/auth/register', userData).then(res => res.data),

    logout: () =>
        api.post('/auth/logout').then(res => res.data),

    getCurrentUser: () =>
        api.get('/auth/me').then(res => res.data),
};

// ... остальные API остаются без изменений

// User API
export const userAPI = {
    getUserById: (userId) =>
        api.get(`/user/${userId}`).then(res => res.data),

    updateUser: (userData) => {
        const config = {};
        if (userData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.put('/user/current', userData, config).then(res => res.data);
    },

    updatePassword: (passwordData) =>
        api.put('/user/current/password', passwordData).then(res => res.data),
};

// Pets API
export const petsAPI = {
    getSpecies: () =>
        api.get('/pets/species').then(res => res.data),

    getBreeds: (filters = {}) =>
        api.get('/pets/breeds', { params: filters }).then(res => res.data),

    getAllBreeds: () =>
        api.get('/pets/breeds-all').then(res => res.data),

    getBreedById: (id) =>
        api.get(`/pets/breeds/${id}`).then(res => res.data),

    addPet: (petData) =>
        api.post('/pets/my-pets', petData).then(res => res.data),

    getMyPets: () =>
        api.get('/pets/my-pets').then(res => res.data),

    getPetById: (id) =>
        api.get(`/pets/my-pets/${id}`).then(res => res.data),

    updatePet: (id, petData) => {
        const config = {};
        if (petData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.put(`/pets/my-pets/${id}`, petData, config).then(res => res.data);
    },

    deletePet: (id) =>
        api.delete(`/pets/my-pets/${id}`).then(res => res.data),

    getReminders: () =>
        api.get('/pets/reminders').then(res => res.data),

    createReminder: (reminderData) =>
        api.post('/pets/reminders', reminderData).then(res => res.data),

    updateReminderStatus: (id, status) =>
        api.patch(`/pets/reminders/${id}`, { status }).then(res => res.data),

    deleteReminder: (id) =>
        api.delete(`/pets/reminders/${id}`).then(res => res.data),

    deleteCompletedReminders: () =>
        api.delete('/pets/reminders/completed').then(res => res.data),

    getReminderTypes: () =>
        api.get('/pets/reminder-types').then(res => res.data),

    // Pet Logs (Daily Records)
    createPetLog: (petId, logData) =>
        api.post(`/pets/my-pets/${petId}/logs`, logData).then(res => res.data),

    getPetLogs: (petId, startDate, endDate) => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return api.get(`/pets/my-pets/${petId}/logs`, { params }).then(res => res.data);
    },

    deletePetLog: (petId, logId) =>
        api.delete(`/pets/my-pets/${petId}/logs/${logId}`).then(res => res.data),

    getPetLogStats: (petId, days = 30) =>
        api.get(`/pets/my-pets/${petId}/logs/stats`, { params: { days } }).then(res => res.data),

    getBreedReviews: (breedId) =>
        api.get(`/pets/breeds/${breedId}/reviews`).then(res => res.data),

    getReviewReactions: (reviewId) =>
        api.get(`/pets/reviews/${reviewId}/reactions`).then(res => res.data),

    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/pets/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(res => res.data);
    },
};

// Articles API
export const articlesAPI = {
    getArticles: (filters = {}) =>
        api.get('/articles', { params: filters }).then(res => res.data),

    getArticleById: (id) =>
        api.get(`/articles/${id}`).then(res => res.data),

    incrementArticleView: (id) =>
        api.post(`/articles/${id}/view`).then(res => res.data),

    createArticle: (articleData) => {
        const config = {};
        if (articleData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.post('/articles', articleData, config).then(res => res.data);
    },

    updateArticle: (id, articleData) => {
        const config = {};
        if (articleData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.put(`/articles/${id}`, articleData, config).then(res => res.data);
    },

    deleteArticle: (id, reason = null) =>
        api.delete(`/articles/${id}`, { data: { reason } }).then(res => res.data),

    saveArticle: (articleId) =>
        api.post('/articles/save', { articleId }).then(res => res.data),

    unsaveArticle: (id) =>
        api.delete(`/articles/save/${id}`).then(res => res.data),

    getSavedArticles: () =>
        api.get('/articles/saved/articles').then(res => res.data),

    getArticleCategories: () =>
        api.get('/articles/categories').then(res => res.data),
};

// Breed Requests API
export const breedRequestsAPI = {
    createRequest: (requestData) => {
        const config = {};
        if (requestData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.post('/breed-requests', requestData, config).then(res => res.data);
    },

    getRequests: () =>
        api.get('/breed-requests').then(res => res.data),

    getUserRequests: () =>
        api.get('/breed-requests/my-requests').then(res => res.data),

    updateRequestStatus: (id, status) =>
        api.patch(`/breed-requests/${id}/status`, { status }).then(res => res.data),

    updateRequest: (id, requestData) => {
        const config = {};
        if (requestData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.put(`/breed-requests/${id}`, requestData, config).then(res => res.data);
    },
};

// Admin API
export const adminAPI = {
    addSpecies: (speciesData) =>
        api.post('/admin/species', speciesData).then(res => res.data),

    updateSpecies: (id, speciesData) =>
        api.put(`/admin/species/${id}`, speciesData).then(res => res.data),

    deleteSpecies: (id) =>
        api.delete(`/admin/species/${id}`).then(res => res.data),

    addBreed: (breedData) => {
        const config = {};
        if (breedData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.post('/admin/breeds', breedData, config).then(res => res.data);
    },

    updateBreed: (id, breedData) => {
        const config = {};
        if (breedData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }
        return api.put(`/admin/breeds/${id}`, breedData, config).then(res => res.data);
    },

    deleteBreed: (id) =>
        api.delete(`/admin/breeds/${id}`).then(res => res.data),

    addArticleCategory: (categoryData) =>
        api.post('/admin/article-categories', categoryData).then(res => res.data),

    updateArticleCategory: (id, categoryData) =>
        api.put(`/admin/article-categories/${id}`, categoryData).then(res => res.data),

    deleteArticleCategory: (id) =>
        api.delete(`/admin/article-categories/${id}`).then(res => res.data),

    deleteArticle: (id) =>
        api.delete(`/admin/articles/${id}`).then(res => res.data),

    addReminderType: (typeData) =>
        api.post('/admin/reminder-types', typeData).then(res => res.data),

    getReminderTypes: () =>
        api.get('/admin/reminder-types').then(res => res.data),

    updateReminderType: (id, typeData) =>
        api.put(`/admin/reminder-types/${id}`, typeData).then(res => res.data),

    deleteReminderType: (id) =>
        api.delete(`/admin/reminder-types/${id}`).then(res => res.data),
};

// Chat API
export const chatAPI = {
    getBreedChatMessages: (breedId, limit = 50) =>
        api.get(`/chat/breeds/${breedId}/messages`, { params: { limit } }).then(res => res.data),

    createBreedChatMessage: (breedId, message) =>
        api.post(`/chat/breeds/${breedId}/messages`, { message }).then(res => res.data),

    getBreedChatUsers: (breedId) =>
        api.get(`/chat/breeds/${breedId}/users`).then(res => res.data),

    toggleReaction: (messageId, reaction) =>
        api.post(`/chat/messages/${messageId}/reaction`, { reaction }).then(res => res.data),

    getMessageReactions: (messageId) =>
        api.get(`/chat/messages/${messageId}/reactions`).then(res => res.data),

    updateMessage: (messageId, message) =>
        api.put(`/chat/messages/${messageId}`, { message }).then(res => res.data),

    deleteMessage: (messageId) =>
        api.delete(`/chat/messages/${messageId}`).then(res => res.data),

    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/chat/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(res => res.data);
    },
};

export default api;