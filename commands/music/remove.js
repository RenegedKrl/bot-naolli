module.exports = {
    name: 'remove',
    aliases: ['remover'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1 || num >= queue.songs.length) return message.reply('⚠️ Digite uma posição válida! (Ex: `n!remove 3`)');
        const song = queue.songs.splice(num, 1)[0];
        message.reply(`🗑️ Música removida da fila: **${song.name}**`);
    }
};
