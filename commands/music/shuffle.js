module.exports = {
    name: 'shuffle',
    aliases: ['embaralhar'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada na fila!');
        
        client.distube.shuffle(message);
        message.reply('🔀 **Fila embaralhada!**');
    }
};
