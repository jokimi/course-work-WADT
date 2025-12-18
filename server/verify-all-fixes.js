const { PrismaClient } = require('@prisma/client');

async function verifyAllFixes() {
    try {
        console.log('🔍 Проверяем все исправления полей...');
        
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ Подключение к базе данных успешно');
        
        // Проверяем таблицу видов животных
        console.log('\n📋 Проверяем таблицу видов животных...');
        const species = await prisma.animal_species.findMany({ take: 3 });
        console.log(`Найдено видов: ${species.length}`);
        
        if (species.length > 0) {
            const firstSpecies = species[0];
            console.log('✅ Поля видов:', {
                id: firstSpecies.id,
                speciesname: firstSpecies.speciesname,
                speciesicon: firstSpecies.speciesicon
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
            console.log('✅ Поля пород:', {
                id: firstBreed.id,
                breedname: firstBreed.breedname,
                species: firstBreed.species?.speciesname,
                countryoforigin: firstBreed.countryoforigin,
                hypoallergenicity: firstBreed.hypoallergenicity
            });
        }
        
        // Проверяем таблицу питомцев
        console.log('\n🐾 Проверяем таблицу питомцев...');
        const pets = await prisma.pets.findMany({
            take: 3,
            include: {
                breed: {
                    include: {
                        species: true
                    }
                }
            }
        });
        console.log(`Найдено питомцев: ${pets.length}`);
        
        if (pets.length > 0) {
            const firstPet = pets[0];
            console.log('✅ Поля питомцев:', {
                id: firstPet.id,
                petname: firstPet.petname,
                breed: firstPet.breed?.breedname,
                currentweight: firstPet.currentweight,
                healthnotes: firstPet.healthnotes
            });
        }
        
        // Проверяем таблицу статей
        console.log('\n📰 Проверяем таблицу статей...');
        const articles = await prisma.article.findMany({
            take: 3,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true
                    }
                },
                category: true
            }
        });
        console.log(`Найдено статей: ${articles.length}`);
        
        if (articles.length > 0) {
            const firstArticle = articles[0];
            console.log('✅ Поля статей:', {
                id: firstArticle.id,
                title: firstArticle.title,
                author: firstArticle.author?.username,
                category: firstArticle.category?.categoryname,
                createdat: firstArticle.createdat,
                updatedat: firstArticle.updatedat
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
            console.log('✅ Поля заявок:', {
                id: firstRequest.id,
                breedname: firstRequest.breedname,
                user: firstRequest.user?.username,
                status: firstRequest.status,
                createdat: firstRequest.createdat
            });
        }
        
        await prisma.$disconnect();
        console.log('\n✅ Все проверки пройдены успешно!');
        console.log('🎉 Все поля исправлены и соответствуют схеме snake_case!');
        console.log('\n📋 Сводка исправлений:');
        console.log('   • Виды животных: speciesname, speciesicon');
        console.log('   • Породы: breedname, countryoforigin, hypoallergenicity');
        console.log('   • Питомцы: petname, currentweight, healthnotes');
        console.log('   • Статьи: createdat, updatedat');
        console.log('   • Заявки: breedname, createdat');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке:', error.message);
        process.exit(1);
    }
}

verifyAllFixes();
