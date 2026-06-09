module.exports = {
    name: 'pause',
    aliases: ['pausar'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        if (queue.paused) return message.reply('⚠️ A música já está pausada!');

        client.distube.pause(message);
        message.reply('⏸️ **Música pausada!** Use `n!resume` para voltar.');
    }
};
