module.exports = {
    name: 'move',
    aliases: ['mover'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const from = parseInt(args[0]);
        const to = parseInt(args[1]);
        if (isNaN(from) || isNaN(to) || from < 1 || to < 1 || from >= queue.songs.length || to >= queue.songs.length) {
            return message.reply('⚠️ Use as posições corretas! (Ex: `n!move 3 1` para mover a música 3 para a posição 1)');
        }
        const song = queue.songs.splice(from, 1)[0];
        queue.songs.splice(to, 0, song);
        message.reply(`🚚 Movida: **${song.name}** para a posição **${to}** da fila!`);
    }
};
