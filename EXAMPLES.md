# Примеры использования AutoWebhook

Здесь вы найдете несколько примеров, демонстрирующих, как использовать библиотеку `AutoWebhook` в различных сценариях.

## Пример 1: Базовое использование

Этот пример показывает, как получить публичный URL. Этого достаточно, если вам просто нужен стабильный адрес для доступа к вашему локальному серверу.

```typescript
// examples/basic.ts
import { AutoWebhook } from '@rozeraf/autowebhook';

async function main() {
  // Инициализируем AutoWebhook, указывая порт вашего локального сервера
  const webhook = new AutoWebhook({ port: 3000 });

  try {
    // Запускаем туннель и ждем получения URL
    const url = await webhook.start();

    console.log('✨ Ваш вечный вебхук готов:', url);
    console.log('Нажмите Ctrl+C для завершения.');

    // Теперь вы можете использовать этот URL для настройки вебхуков
    // или для доступа к вашему локальному приложению извне.

  } catch (error) { 
    console.error('Не удалось запустить AutoWebhook:', error);
  }
}

main();
```

## Пример 2: Интеграция с Telegram-ботом (grammy)

Это наиболее распространенный сценарий использования: автоматическая настройка вебхука для бота при каждом запуске приложения.

```typescript
// examples/telegram-bot.ts
import { AutoWebhook } from '@rozeraf/autowebhook';
import { Bot, webhookCallback } from 'grammy';
import express from 'express';

// --- Конфигурация ---
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const PORT = 3000;

async function setupBot() {
  // 1. Инициализируем AutoWebhook
  const autowebhook = new AutoWebhook({ port: PORT });

  // 2. Создаем экземпляр бота
  const bot = new Bot(BOT_TOKEN);

  // 3. Настраиваем логику бота
  bot.command('start', (ctx) => ctx.reply('Привет! Я работаю через AutoWebhook!'));
  bot.on('message', (ctx) => ctx.reply('Получил ваше сообщение!'));

  // 4. Запускаем туннель и получаем URL
  const webhookUrl = await autowebhook.start();
  console.log(`Вебхук URL: ${webhookUrl}`);

  // 5. Настраиваем веб-сервер для обработки входящих обновлений от Telegram
  const server = express();
  server.use(express.json());
  server.use(`/webhook`, webhookCallback(bot, 'express'));

  server.listen(PORT, async () => {
    // 6. Устанавливаем вебхук в Telegram
    await bot.api.setWebhook(`${webhookUrl}/webhook`);
    console.log(`Бот запущен! Сервер слушает порт ${PORT}`);
  });
}

setupBot().catch(console.error);
```

## Пример 3: Продвинутое использование с обработкой событий

Вы можете отслеживать жизненный цикл туннеля, используя события. Это полезно для логирования, мониторинга или выполнения действий при изменении состояния.

```typescript
// examples/advanced.ts
import { AutoWebhook } from '@rozeraf/autowebhook';

const webhook = new AutoWebhook({
  port: 8080,
  region: 'eu',
  healthCheck: {
    interval: 15000, // Проверять каждые 15 секунд
    maxFailures: 2,  // Перезапускать после 2 сбоев
  },
});

// Событие: туннель готов
webhook.on('ready', (url) => {
  console.log(`✅ Туннель готов и доступен по адресу: ${url}`);
});

// Событие: начинается перезапуск
webhook.on('restarting', () => {
  console.warn('⚠️ Обнаружена проблема. Начинается перезапуск туннеля...');
});

// Событие: туннель успешно перезапущен
webhook.on('restarted', (newUrl) => {
  console.log(`🔄 Туннель успешно перезапущен. Новый URL: ${newUrl}`);
  // Здесь вы можете обновить URL вебхука в вашем сервисе
  // await bot.api.setWebhook(newUrl);
});

// Событие: ошибка процесса ngrok
webhook.on('error', (error) => {
  console.error(`❌ Произошла критическая ошибка в процессе ngrok:`, error);
});

// Событие: превышено количество попыток перезапуска
webhook.on('maxRestartsReached', () => {
  console.error('🚫 Превышено максимальное количество попыток перезапуска. Проверьте логи.');
  // Здесь можно отправить уведомление администратору
});

async function run() {
  try {
    await webhook.start();
  } catch (err) {
    console.error('Не удалось запустить ngrok:', err);
  }
}

run();
```
