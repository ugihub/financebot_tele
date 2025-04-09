require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Konfigurasi Bot
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, {
    polling: true,
    cancelRequestOnRateLimit: true,
    webHook: {
        maxConnections: 40,
        allowedUpdates: ['message']
    }
});

// Handler /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        "Halo! Bot Informasi Saham AS.\n" +
        "Ketik simbol saham AS (contoh: AAPL, TSLA, MSFT)"
    );
});

// Handler pesan
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim().toUpperCase() || '';

    if (!isValidUSStockSymbol(text)) {
        return bot.sendMessage(chatId, "⚠️ Format simbol salah");
    }

    try {
        const data = await getStockInfo(text);
        bot.sendMessage(chatId, data, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        bot.sendMessage(chatId, `⚠️ Error: ${error.message}`);
    }
});

// Validasi simbol
function isValidUSStockSymbol(symbol) {
    return /^[A-Z]{3,5}$/.test(symbol);
}

// Ambil data saham
async function getStockInfo(symbol) {
    const endpoint = 'https://www.alphavantage.co/query';
    const params = {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: ALPHA_VANTAGE_API_KEY
    };

    try {
        const response = await axios.get(endpoint, { params });
        const data = response.data;

        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }

        const quote = data['Global Quote'];
        if (!quote) {
            throw new Error('Data saham tidak tersedia');
        }

        // Format pesan sesuai contoh
        return `
**INFORMASI SAHAM US - ${symbol}**

*Harga Terkini*: $${quote['05. price']}
*Harga Pembukaan*: $${quote['02. open']}
*Harga Tertinggi*: $${quote['03. high']}
*Harga Terendah*: $${quote['04. low']}
*Volume Transaksi*: ${quote['06. volume']}
*Tanggal Terakhir*: ${quote['07. latest trading day']}
*Perubahan*: ${quote['09. change']} (${quote['10. change percent']})
`.trim();
    } catch (error) {
        throw new Error(error.response?.data['Error Message'] || error.message);
    }
}

// Mulai polling
bot.startPolling();