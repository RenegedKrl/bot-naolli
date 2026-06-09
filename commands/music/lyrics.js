const { EmbedBuilder } = require('discord.js');
const { Client: GeniusClient } = require('genius-lyrics');
const genius = new GeniusClient();

module.exports = {
    name: 'lyrics',
    aliases: ['letra'],
    async execute(message, args, client) {
        let query = args.join(' ');
        if (!query) {
            const queue = client.distube.getQueue(message);
            if (!queue) return message.reply('⚠️ Digite o nome da música ou toque uma música para buscar a letra!');
            query = queue.songs[0].name;
        }

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setDescription('🔍 Buscando a letra no Genius (isso pode levar uns segundos)...');
        
        const msg = await message.reply({ embeds: [embed] });

        try {
            const searches = await genius.songs.search(query);
            if (!searches || searches.length === 0) throw new Error('Não encontrado');
            
            const song = searches[0];
            let lyrics = await song.lyrics();

            if (!lyrics) throw new Error('Sem letra');

            if (lyrics.length > 4000) {
                lyrics = lyrics.substring(0, 4000) + '...';
            }

            const resEmbed = new EmbedBuilder()
                .setColor('#FFFF00')
                .setTitle(`🎤 Letra: ${song.title} - ${song.artist.name}`)
                .setThumbnail(song.thumbnail)
                .setDescription(lyrics)
                .setFooter({ text: 'Fonte: Genius.com' });

            msg.edit({ embeds: [resEmbed] });
        } catch (error) {
            msg.edit({ embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('❌ Não consegui encontrar a letra dessa música no Genius.')] });
        }
    }
};
