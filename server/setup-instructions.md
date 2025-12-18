# Инструкции по настройке сервера

## Проблема
Сервер не запускается из-за отсутствия файла `.env` с настройками базы данных.

## Решение

### 1. Создайте файл `.env` в папке `server` со следующим содержимым:

```
DATABASE_URL="postgresql://username:password@localhost:5432/pet_tracker_db"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=5000
NODE_ENV=development
```

### 2. Настройте PostgreSQL

1. Установите PostgreSQL на вашем компьютере
2. Создайте базу данных с именем `pet_tracker_db`
3. Обновите `DATABASE_URL` в файле `.env` с правильными учетными данными

### 3. Выполните Prisma миграции

```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Запустите сервер

```bash
node index.js
```

### 5. Запустите клиент

```bash
cd client
npm start
```

## Альтернативное решение (SQLite)

Если PostgreSQL недоступен, можно использовать SQLite:

1. Измените `DATABASE_URL` в `.env` на:
   ```
   DATABASE_URL="file:./dev.db"
   ```

2. Измените провайдер в `prisma/schema.prisma`:
   ```
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Выполните миграции:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

