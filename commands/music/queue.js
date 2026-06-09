const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'queue',
    aliases: ['fila', 'q'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando no momento!');

        const q = queue.songs.map((song, i) => `${i === 0 ? '🎵 **Tocando:**' : `**${i}.**`} [${song.name}](${song.url}) - \`${song.formattedDuration}\``).slice(0, 10).join('\n\n');
        
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('📋 Fila de Músicas')
            .setDescription(`${q}\n\n*E mais ${queue.songs.length > 10 ? queue.songs.length - 10 : 0} músicas...*`)
            .setFooter({ text: `Total na fila: ${queue.songs.length}` });

        message.reply({ embeds: [embed] });
    }
};
