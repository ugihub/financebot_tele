// Mengimpor modul dan kode bot
const { handleTelegramMessage } = require('../server.js');

exports.handler = async (event, context) => {
    try {
        await handleTelegramMessage(event, context);
        return {
            statusCode: 200,
            body: 'OK'
        };
    } catch (error) {
        console.error("Error handling Telegram message:", error);
        return {
            statusCode: 200,
            body: 'OK' // Telegram membutuhkan respons 200
        };
    }
};