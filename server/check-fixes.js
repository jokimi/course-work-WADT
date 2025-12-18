const { PrismaClient } = require('@prisma/client');

async function checkFixes() {
    try {
        console.log('🔍 Проверяем исправления...');
        
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ Подключение к базе данных успешно');
        
        // Проверяем таблицу видов животных
        console.log('\n📋 Проверяем таблицу видов животных...');
        const species = await prisma.animal_species.findMany();
        console.log(`Найдено видов: ${species.length}`);
        
        if (species.length > 0) {
            const firstSpecies = species[0];
            console.log('Пример вида:', {
                id: firstSpecies.id,
                name: firstSpecies.speciesname,
                icon: firstSpecies.speciesicon
            });
        }
        
        // Проверяем таблицу пород
        console.log('\n🐕 Проверяем таблицу пород...');
        const breeds = await prisma.animal_breeds.findMany({
            take: 3,
            include: {
                species: true
            }
        });
        console.log(`Найдено пород: ${breeds.length}`);
        
        if (breeds.length > 0) {
            const firstBreed = breeds[0];
            console.log('Пример породы:', {
                id: firstBreed.id,
                name: firstBreed.breedname,
                species: firstBreed.species?.speciesname,
                country: firstBreed.countryoforigin
            });
        }
        
        // Проверяем таблицу заявок
        console.log('\n📝 Проверяем таблицу заявок...');
        const requests = await prisma.breed_requests.findMany({
            take: 3,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true
                    }
                }
            }
        });
        console.log(`Найдено заявок: ${requests.length}`);
        
        if (requests.length > 0) {
            const firstRequest = requests[0];
            console.log('Пример заявки:', {
                id: firstRequest.id,
                breedName: firstRequest.breedname,
                user: firstRequest.user?.username,
                status: firstRequest.status,
                createdAt: firstRequest.createdat
            });
        }
        
        // Проверяем пользователей
        console.log('\n👥 Проверяем пользователей...');
        const users = await prisma.users.findMany({
            take: 3,
            select: {
                id: true,
                username: true,
                name: true,
                role: true
            }
        });
        console.log(`Найдено пользователей: ${users.length}`);
        
        const adminUsers = users.filter(user => user.role === 'admin');
        console.log(`Администраторов: ${adminUsers.length}`);
        
        await prisma.$disconnect();
        console.log('\n✅ Все проверки пройдены успешно!');
        console.log('🎉 Исправления применены корректно!');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке:', error.message);
        process.exit(1);
    }
}

checkFixes();
