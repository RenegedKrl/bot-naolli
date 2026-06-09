const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'tocando'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const song = queue.songs[0];
        
        const part = Math.floor((queue.currentTime / song.duration) * 30);
        const bar = '▬'.repeat(Math.max(0, part)) + '🔘' + '▬'.repeat(Math.max(0, 30 - part));

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🎶 Tocando Agora')
            .setDescription(`**[${song.name}](${song.url})**\n\n\`${queue.formattedCurrentTime}\` ${bar} \`${song.formattedDuration}\``)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Pedida por ${song.user.tag}` });
            
        message.reply({ embeds: [embed] });
    }
};
