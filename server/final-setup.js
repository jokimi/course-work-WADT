const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function finalSetup() {
    try {
        console.log('🚀 Начинаем финальную настройку...');
        
        // 1. Генерируем Prisma Client
        console.log('📦 Генерируем Prisma Client...');
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma Client сгенерирован');
        
        // 2. Применяем миграции
        console.log('🔄 Применяем миграции...');
        try {
            execSync('npx prisma migrate dev --name update-schema-to-snake-case', { stdio: 'inherit' });
            console.log('✅ Миграции применены');
        } catch (error) {
            console.log('⚠️ Миграции уже применены или есть конфликты');
        }
        
        // 3. Проверяем подключение к базе данных
        console.log('🔍 Проверяем подключение к базе данных...');
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ Подключение к базе данных успешно');
        
        // 4. Проверяем основные таблицы
        console.log('📋 Проверяем основные таблицы...');
        
        // Проверяем таблицу пользователей
        const users = await prisma.users.findMany({ take: 1 });
        console.log('✅ Таблица users доступна');
        
        // Проверяем таблицу видов животных
        const species = await prisma.animal_species.findMany({ take: 1 });
        console.log('✅ Таблица animal_species доступна');
        
        // Проверяем таблицу заявок
        const requests = await prisma.breed_requests.findMany({ take: 1 });
        console.log('✅ Таблица breed_requests доступна');
        
        // Проверяем пользователей с ролью admin
        const adminUsers = await prisma.users.findMany({
            where: { role: 'admin' },
            select: { id: true, username: true, role: true }
        });
        console.log('👑 Администраторы:', adminUsers);
        
        await prisma.$disconnect();
        console.log('✅ Все проверки пройдены успешно!');
        console.log('🎉 Сервер готов к работе!');
        
    } catch (error) {
        console.error('❌ Ошибка при настройке:', error.message);
        process.exit(1);
    }
}

finalSetup();
