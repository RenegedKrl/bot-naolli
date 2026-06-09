const { EmbedBuilder } = require('discord.js');

async function translateText(text) {
    if (!text) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
        const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
        const res = await fetchFn(url);
        const json = await res.json();
        return json[0].map(item => item[0]).join('');
    } catch (e) {
        return text;
    }
}

module.exports = {
    name: 'ima',
    aliases: ['series', 'anime'],
    description: 'Pesquisa informações de uma série/anime.',
    async execute(message, args) {
        if (!args.length) {
            return message.reply('⚠️ Por favor, digite o nome do anime/mangá que deseja pesquisar. Ex: `n!ima Naruto`');
        }

        const searchQuery = args.join(' ');
        const msg = await message.reply('🔍 Pesquisando série...');

        try {
            const query = `
            query ($search: String) { 
                Media(search: $search, type: ANIME) { 
                    id 
                    title { romaji english native } 
                    coverImage { large } 
                    description 
                    episodes
                    status
                    averageScore
                } 
            }`;

            const variables = { search: searchQuery };

            const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
            const res = await fetchFn('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables })
            });
            
            const data = await res.json();
            
            if (data.errors || !data.data.Media) {
                return msg.edit('❌ Série não encontrada. Tente verificar a ortografia.');
            }

            const media = data.data.Media;
            const title = media.title.romaji || media.title.english || 'Título Desconhecido';
            const nativeTitle = media.title.native ? ` (${media.title.native})` : '';
            const imageUrl = media.coverImage.large;
            const episodes = media.episodes || '?';
            const score = media.averageScore ? `${media.averageScore}/100` : '?';
            
            let rawDescription = media.description || '*Sem descrição disponível.*';
            rawDescription = rawDescription.replace(/__|<\/?i>|<\/?b>|~!|!~/g, '').replace(/<br>/g, '\n');
            if (rawDescription.length > 500) {
                rawDescription = rawDescription.substring(0, 500) + '...';
            }
            
            const translatedDescription = await translateText(rawDescription);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${title}${nativeTitle}`)
                .setURL(`https://anilist.co/anime/${media.id}`)
                .setDescription(`${translatedDescription}`)
                .addFields(
                    { name: '📺 Episódios', value: `${episodes}`, inline: true },
                    { name: '⭐️ Nota', value: `${score}`, inline: true },
                    { name: '📌 Status', value: `${media.status || 'Desconhecido'}`, inline: true }
                )
                .setImage(imageUrl)
                .setFooter({ text: `ID: ${media.id}` });

            await msg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error(error);
            msg.edit('❌ Ocorreu um erro ao conectar com a API de animes. Tente novamente mais tarde.');
        }
    }
};
