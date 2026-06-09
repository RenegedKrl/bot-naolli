module.exports = {
    name: 'resume',
    aliases: ['continuar', 'despausar'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        if (!queue.paused) return message.reply('⚠️ A música já está tocando!');

        client.distube.resume(message);
        message.reply('▶️ **Música retomada!** A festa continua.');
    }
};
