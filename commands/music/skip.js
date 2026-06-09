module.exports = {
    name: 'skip',
    aliases: ['s', 'pular'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nenhuma música tocando no momento!');

        try {
            await client.distube.skip(message);
            message.reply('⏭️ Música pulada com sucesso!');
        } catch (error) {
            // Se houver apenas 1 música na fila, o skip dá erro porque não há próxima, então usamos stop
            if (queue.songs.length === 1) {
                await client.distube.stop(message);
                message.reply('⏹️ A fila acabou.');
            } else {
                message.reply('❌ Ocorreu um erro ao tentar pular a música.');
            }
        }
    }
};
