module.exports = {
    name: 'loop',
    aliases: ['repetir'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const mode = client.distube.setRepeatMode(message, 1);
        message.reply(mode ? '🔁 **Loop da música** ativado!' : '🔁 Loop desativado!');
    }
};
