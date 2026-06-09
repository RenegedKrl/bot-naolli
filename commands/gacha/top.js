const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    aliases: ['topchars', 'rank'],
    description: 'Mostra o Top de personagens mais populares globalmente (Baseado no Anilist).',
    async execute(message, args) {
        const msg = await message.reply('🔍 Buscando o Top Global de Personagens...');

        try {
            const query = `
            query { 
                Page(page: 1, perPage: 15) { 
                    characters(sort: FAVORITES_DESC) { 
                        id 
                        name { full } 
                        favorites
                        image { medium }
                    } 
                } 
            }`;

            const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
            const res = await fetchFn('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            
            const data = await res.json();
            
            if (data.errors || !data.data.Page.characters) {
                return msg.edit('❌ Erro ao buscar o ranking.');
            }

            const characters = data.data.Page.characters;
            let description = '';

            characters.forEach((char, index) => {
                let medal = '';
                if (index === 0) medal = '🥇 ';
                else if (index === 1) medal = '🥈 ';
                else if (index === 2) medal = '🥉 ';
                else medal = `**${index + 1}.** `;

                description += `${medal}**${char.name.full}** - 💖 ${char.favorites.toLocaleString()}\n`;
            });

            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle('🏆 Top Personagens Global (Anilist)')
                .setDescription(description)
                .setThumbnail(characters[0].image.medium);

            await msg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error(error);
            msg.edit('❌ Ocorreu um erro ao conectar com a API.');
        }
    }
};
