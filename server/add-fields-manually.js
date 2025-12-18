const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addFieldsManually() {
    try {
        console.log('🔧 Добавляем поля вручную...');
        
        // Проверяем структуру таблицы
        const sampleRequest = await prisma.breed_requests.findFirst();
        if (sampleRequest) {
            console.log('📋 Текущие поля:', Object.keys(sampleRequest));
        }
        
        // Пробуем выполнить SQL напрямую для добавления полей
        console.log('⚠️ Внимание: Этот скрипт требует ручного выполнения SQL команд');
        console.log('Выполните следующие SQL команды в вашей базе данных:');
        console.log('');
        console.log('ALTER TABLE "breed_requests" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT \'pending\';');
        console.log('ALTER TABLE "breed_requests" ADD COLUMN IF NOT EXISTS "createdat" TIMESTAMP DEFAULT NOW();');
        console.log('');
        console.log('После выполнения команд перезапустите сервер.');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addFieldsManually();
