module.exports = {
    name: 'skipto',
    aliases: ['pularpara'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1 || num >= queue.songs.length) return message.reply('⚠️ Digite uma posição válida da fila! (Ex: `n!skipto 3`)');
        client.distube.jump(message, num).then(song => {
            message.reply(`⏭️ Pulei diretamente para a música: **${song.name}**`);
        });
    }
};
