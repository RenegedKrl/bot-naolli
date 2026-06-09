module.exports = {
    name: 'stop',
    aliases: ['parar', 'leave'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nenhuma música tocando no momento!');

        try {
            await client.distube.stop(message);
            message.reply('⏹️ Música parada e a fila foi limpa!');
        } catch (error) {
            message.reply('❌ Ocorreu um erro ao tentar parar a música.');
        }
    }
};
