module.exports = {
    name: 'loopqueue',
    aliases: ['repetirfila'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const mode = client.distube.setRepeatMode(message, 2);
        message.reply(mode ? '🔁 **Loop da fila inteira** ativado!' : '🔁 Loop desativado!');
    }
};
