const breedRequestService = require("../services/breedRequestService");

exports.createBreedRequest = async (req, res) => {
    try {
        const breedData = { ...req.body };
        
        // Преобразуем hypoallergenicity в boolean
        if (breedData.hypoallergenicity !== undefined) {
            breedData.hypoallergenicity = breedData.hypoallergenicity === 'true' || breedData.hypoallergenicity === true || breedData.hypoallergenicity === 'True';
        }
        
        // Если есть загруженный файл фото
        if (req.file) {
            breedData.photo = `/uploads/${req.file.filename}`;
        }
        
        const request = await breedRequestService.createBreedRequest(req.user.userId, breedData);
        res.status(201).json({ message: "Заявка отправлена", request });
    } catch (error) {
        res.status(500).json({ message: error.message || "Ошибка при отправке заявки" });
    }
};

exports.getBreedRequests = async (req, res) => {
    try {
        console.log('Getting breed requests...');
        const requests = await breedRequestService.getBreedRequests();
        console.log('Breed requests retrieved:', requests.length);
        res.status(200).json(requests);
    } catch (error) {
        console.error('Error getting breed requests:', error);
        res.status(500).json({ message: "Ошибка при получении заявок", error: error.message });
    }
};

exports.getUserBreedRequests = async (req, res) => {
    try {
        const requests = await breedRequestService.getUserBreedRequests(req.user.userId);
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при получении заявок" });
    }
};

exports.updateBreedRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(`📝 Обновление статуса заявки ID: ${id}, новый статус: ${status}`);
        const updatedRequest = await breedRequestService.updateBreedRequestStatus(id, status);
        res.status(200).json({ 
            message: status === 'approved' 
                ? "Заявка одобрена и порода добавлена в каталог" 
                : "Статус заявки обновлен", 
            updatedRequest 
        });
    } catch (error) {
        console.error('❌ Ошибка в контроллере при обновлении статуса заявки:', error);
        res.status(500).json({ 
            message: error.message || "Ошибка при обновлении статуса заявки",
            error: error.message 
        });
    }
};

exports.updateBreedRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const breedData = { ...req.body };
        
        // Преобразуем hypoallergenicity в boolean
        if (breedData.hypoallergenicity !== undefined) {
            breedData.hypoallergenicity = breedData.hypoallergenicity === 'true' || breedData.hypoallergenicity === true || breedData.hypoallergenicity === 'True';
        }
        
        // Если есть загруженный файл фото
        if (req.file) {
            breedData.photo = `/uploads/${req.file.filename}`;
        }
        
        const updatedRequest = await breedRequestService.updateBreedRequest(id, breedData);
        res.status(200).json({ 
            message: "Заявка обновлена", 
            updatedRequest 
        });
    } catch (error) {
        res.status(500).json({ 
            message: error.message || "Ошибка при обновлении заявки",
            error: error.message 
        });
    }
};