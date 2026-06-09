const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'harem',
    aliases: ['collection', 'waifus', 'arem', 'mm'],
    async execute(message, args) {
        const config = await getData('gachaConfig.json');
        const guildId = message.guild.id;
        
        if (!config[guildId]) return message.reply('⚠️ Ninguém no servidor tem personagens ainda! Use `n!roll`.');

        const target = message.mentions.users.first() || message.author;
        
        const harem = Object.values(config[guildId]).filter(char => char.ownerId === target.id);
        
        if (harem.length === 0) {
            return message.reply(`💔 **${target.username}** ainda não possui personagens na coleção! Use \`n!roll\`.`);
        }

        const itemsPerPage = 15;
        const totalPages = Math.ceil(harem.length / itemsPerPage);
        let currentPage = 0;

        const getListEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = harem.slice(start, end);
            
            const list = pageItems.map((char, i) => `**${start + i + 1}.** ${char.name} *(de ${char.anime})*`).join('\n');
            
            return new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle(`💍 Coleção de ${target.username} (${harem.length})`)
                .setDescription(list)
                .setFooter({ text: `Página ${page + 1}/${totalPages} | Digite um número no chat para ver o personagem` });
        };

        const listMessage = await message.reply({ embeds: [getListEmbed(0)] });

        const filter = m => m.author.id === message.author.id && !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) <= harem.length;
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async (m) => {
            const index = parseInt(m.content) - 1;
            await showCharacter(index, listMessage, m);
            collector.stop('selected');
        });

        async function showCharacter(currentIndex, listMsg, triggerMessage) {
            const getCharEmbed = (index) => {
                const character = harem[index];
                // Fallback para personagens antigos sem imageUrl
                const rarityText = character.rarity ? `\n🌟 Raridade: **${character.rarity}**` : '';
                const embed = new EmbedBuilder()
                    .setColor('#FF1493')
                    .setTitle(`${character.name}`)
                    .setDescription(`**Anime:** ${character.anime}${rarityText}\n\n*Personagem ${index + 1} de ${harem.length}*`)
                    .setFooter({ text: `Pertence a: ${target.username}`, iconURL: target.displayAvatarURL({ dynamic: true }) });
                if (character.imageUrl) {
                    embed.setImage(character.imageUrl);
                }
                return embed;
            };

            const getButtons = (index) => {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev_char')
                            .setLabel('⬅️ Anterior')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(index === 0),
                        new ButtonBuilder()
                            .setCustomId('next_char')
                            .setLabel('Próximo ➡️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(index === harem.length - 1)
                    );
                return row;
            };

            const charMessage = await triggerMessage.reply({ 
                embeds: [getCharEmbed(currentIndex)], 
                components: [getButtons(currentIndex)] 
            });

            const btnCollector = charMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

            let currentViewIndex = currentIndex;

            btnCollector.on('collect', async (i) => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: 'Você não pode usar estes botões.', ephemeral: true });
                }

                if (i.customId === 'prev_char') {
                    currentViewIndex--;
                } else if (i.customId === 'next_char') {
                    currentViewIndex++;
                }

                await i.update({
                    embeds: [getCharEmbed(currentViewIndex)],
                    components: [getButtons(currentViewIndex)]
                });
            });

            btnCollector.on('end', () => {
                charMessage.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
