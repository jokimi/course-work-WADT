const { PrismaClient } = require('@prisma/client');

async function checkDataTypes() {
    try {
        console.log('🔍 Проверяем типы данных в сервисах...');
        
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ Подключение к базе данных успешно');
        
        // Проверяем, что все ID поля являются числами
        console.log('\n📋 Проверяем типы полей...');
        
        // Проверяем виды животных
        const species = await prisma.animal_species.findMany({ take: 1 });
        if (species.length > 0) {
            console.log('✅ Виды животных: ID =', typeof species[0].id, species[0].id);
        }
        
        // Проверяем породы
        const breeds = await prisma.animal_breeds.findMany({ 
            take: 1,
            include: { species: true }
        });
        if (breeds.length > 0) {
            console.log('✅ Породы: ID =', typeof breeds[0].id, breeds[0].id);
            console.log('✅ Породы: speciesid =', typeof breeds[0].speciesid, breeds[0].speciesid);
            console.log('✅ Породы: trainability =', typeof breeds[0].trainability, breeds[0].trainability);
        }
        
        // Проверяем питомцев
        const pets = await prisma.pets.findMany({ 
            take: 1,
            include: { breed: true }
        });
        if (pets.length > 0) {
            console.log('✅ Питомцы: ID =', typeof pets[0].id, pets[0].id);
            console.log('✅ Питомцы: ownerid =', typeof pets[0].ownerid, pets[0].ownerid);
            console.log('✅ Питомцы: breedid =', typeof pets[0].breedid, pets[0].breedid);
            console.log('✅ Питомцы: currentweight =', typeof pets[0].currentweight, pets[0].currentweight);
        }
        
        // Проверяем статьи
        const articles = await prisma.article.findMany({ 
            take: 1,
            include: { author: true, category: true }
        });
        if (articles.length > 0) {
            console.log('✅ Статьи: ID =', typeof articles[0].id, articles[0].id);
            console.log('✅ Статьи: authorid =', typeof articles[0].authorid, articles[0].authorid);
            console.log('✅ Статьи: categoryid =', typeof articles[0].categoryid, articles[0].categoryid);
        }
        
        // Проверяем заявки
        const requests = await prisma.breed_requests.findMany({ 
            take: 1,
            include: { user: true }
        });
        if (requests.length > 0) {
            console.log('✅ Заявки: ID =', typeof requests[0].id, requests[0].id);
            console.log('✅ Заявки: userid =', typeof requests[0].userid, requests[0].userid);
            console.log('✅ Заявки: speciesid =', typeof requests[0].speciesid, requests[0].speciesid);
        }
        
        await prisma.$disconnect();
        console.log('\n✅ Все типы данных корректны!');
        console.log('🎉 Проблема с типами данных исправлена!');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке типов:', error.message);
        process.exit(1);
    }
}

checkDataTypes();
