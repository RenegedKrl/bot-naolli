const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData } = require('../../database');
const { getAllCharacterSkins, RARITIES } = require('./skinManager');

async function translateText(text) {
    if (!text) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
        const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
        const res = await fetchFn(url);
        const json = await res.json();
        return json[0].map(item => item[0]).join('');
    } catch (e) {
        console.error('Erro na tradução:', e.message);
        return text;
    }
}

module.exports = {
    name: 'im',
    aliases: ['char', 'info', 'personagem'],
    description: 'Pesquisa as informações de um personagem de anime e verifica de quem ele é no servidor.',
    async execute(message, args) {
        if (!args.length) {
            return message.reply('⚠️ Por favor, digite o nome do personagem que deseja pesquisar. Ex: `n!im Naruto`');
        }

        const searchQuery = args.join(' ');
        const msg = await message.reply('🔍 Pesquisando personagem...');

        try {
            const query = `
            query ($search: String) { 
                Page(page: 1, perPage: 1) { 
                    characters(search: $search) { 
                        id 
                        name { full native } 
                        image { large } 
                        description 
                        media(sort: POPULARITY_DESC, perPage: 1) { 
                            nodes { title { romaji } } 
                        } 
                    } 
                } 
            }`;

            const variables = { search: searchQuery };

            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables })
            });
            
            const data = await res.json();
            
            if (data.errors || !data.data.Page.characters.length) {
                return msg.edit('❌ Personagem não encontrado. Tente verificar a ortografia.');
            }

            const character = data.data.Page.characters[0];
            const charId = character.id.toString();
            const charName = character.name.full;
            const nativeName = character.name.native ? ` (${character.name.native})` : '';
            const animeName = character.media.nodes.length > 0 ? character.media.nodes[0].title.romaji : 'Origem Desconhecida';
            const imageUrl = character.image.large;
            
            let rawDescription = character.description || '*Sem descrição disponível.*';
            rawDescription = rawDescription.replace(/__|<\/?i>|<\/?b>|~!|!~/g, '').replace(/<br>/g, '\n');
            if (rawDescription.length > 500) {
                rawDescription = rawDescription.substring(0, 500) + '...';
            }
            const translatedDescription = await translateText(rawDescription);

            // Buscar peles/imagens
            const skins = await getAllCharacterSkins(charId, charName, imageUrl);

            const guildId = message.guild.id;
            const gachaConfig = await getData('gachaConfig.json');
            const isClaimed = gachaConfig[guildId] && gachaConfig[guildId][charId];

            const getEmbed = (skinIndex) => {
                const skin = skins[skinIndex];
                const rarityColor = RARITIES[skin.rarity]?.color || '#00FF00';
                
                const embed = new EmbedBuilder()
                    .setTitle(`${charName}${nativeName}`)
                    .setURL(`https://anilist.co/character/${charId}`)
                    .setDescription(`**Anime/Mangá:** ${animeName}\n\n${translatedDescription}`)
                    .setImage(skin.url)
                    .setFooter({ text: `ID: ${charId} • Imagem ${skinIndex + 1} de ${skins.length} (${skin.rarity})` });

                if (isClaimed) {
                    embed.setColor('#FF0000'); 
                    const owner = message.guild.members.cache.get(isClaimed.ownerId);
                    const ownerName = owner ? owner.user.username : 'Alguém desconhecido';
                    embed.addFields({ name: '💍 Pertence a:', value: `**${ownerName}**\nNeste servidor, apenas esta pessoa possui o personagem.` });
                } else {
                    embed.setColor(rarityColor);
                    embed.addFields({ name: '✨ Status:', value: 'Este personagem está **livre** no servidor! Role `n!w` para tentar pegá-lo.' });
                }
                
                return embed;
            };

            const getButtons = (skinIndex) => {
                if (skins.length <= 1) return [];
                return [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_skin')
                        .setLabel('⬅️ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(skinIndex === 0),
                    new ButtonBuilder()
                        .setCustomId('next_skin')
                        .setLabel('Próxima ➡️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(skinIndex === skins.length - 1)
                )];
            };

            let currentIndex = 0;
            await msg.edit({ content: '', embeds: [getEmbed(currentIndex)], components: getButtons(currentIndex) });

            if (skins.length > 1) {
                const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

                collector.on('collect', async (i) => {
                    if (i.customId === 'prev_skin') currentIndex--;
                    if (i.customId === 'next_skin') currentIndex++;

                    await i.update({
                        embeds: [getEmbed(currentIndex)],
                        components: getButtons(currentIndex)
                    });
                });

                collector.on('end', () => {
                    msg.edit({ components: [] }).catch(() => {});
                });
            }

        } catch (error) {
            console.error(error);
            msg.edit('❌ Ocorreu um erro ao conectar com a API de animes. Tente novamente mais tarde.');
        }
    }
};
