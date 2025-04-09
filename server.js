require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Konfigurasi Bot Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true, cancelRequestOnRateLimit: true });

// Konfigurasi Alpha Vantage
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Validasi simbol saham AS
function isValidUSStockSymbol(symbol) {
    return /^[A-Z]{3,5}$/.test(symbol);
}

// Fungsi handler pesan
async function handleTelegramMessage(req, res) {
    const chatId = req.body.message.chat.id;
    const text = req.body.message.text?.trim().toUpperCase() || '';

    try {
        if (!isValidUSStockSymbol(text)) {
            return bot.sendMessage(chatId,
                "⚠️ Format simbol salah. Contoh: AAPL, TSLA, MSFT"
            );
        }

        const stockData = await getStockInfo(text);
        bot.sendMessage(chatId, stockData, { parse_mode: 'Markdown' });
        res.status(200).send('OK');

    } catch (error) {
        bot.sendMessage(chatId, `⚠️ Error: ${error.message}`);
        res.status(200).send('OK'); // Harus merespons 200 untuk Telegram
    }
}

// Handler untuk /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        "Halo! Bot Informasi Saham AS.\n" +
        "Ketik simbol saham AS (contoh: AAPL, TSLA, MSFT) untuk mendapatkan informasi terkini."
    );
});

// Fungsi untuk ambil data
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

module.exports = { handleTelegramMessage };