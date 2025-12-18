// server/test-db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDB() {
    try {
        console.log('Testing database connection...');

        // Проверяем подключение
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Пробуем создать тестового пользователя
        const testUser = await prisma.users.create({
            data: {
                username: 'ppsuser1',
                name: 'Ваня',
                email: 'ppsuser1@gmail.com',
                password: 'ppuser1'
            }
        });
        console.log('✅ Test user created:', testUser);

        // Удаляем тестового пользователя
        await prisma.users.delete({
            where: { id: testUser.id }
        });
        console.log('✅ Test user deleted');

        await prisma.$disconnect();
        console.log('✅ All tests passed!');

    } catch (error) {
        console.error('❌ Database error:', error);
        process.exit(1);
    }
}

testDB();