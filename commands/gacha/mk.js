const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'mk',
    aliases: ['makekakera', 'spawnk'],
    description: '(Admin) Força o surgimento de um Kakera no chat.',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('⚠️ Apenas administradores podem forçar o spawn de um Kakera.');
        }

        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('💎 Kakera Dropou!')
            .setDescription('Um Kakera selvagem apareceu! Seja o primeiro a clicar no botão para resgatá-lo.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_kakera')
                    .setEmoji('💎')
                    .setLabel('Resgatar Kakera')
                    .setStyle(ButtonStyle.Primary)
            );

        const dropMsg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = dropMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000, max: 1 });

        collector.on('collect', async i => {
            const amount = Math.floor(Math.random() * 300) + 150; // 150 to 450 kakera
            
            const kakeraConfig = await getData('kakeraConfig.json');
            const guildId = message.guild.id;

            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            kakeraConfig[guildId][i.user.id] = (kakeraConfig[guildId][i.user.id] || 0) + amount;

            await saveData('kakeraConfig.json', kakeraConfig);

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('💎 Kakera Resgatado!')
                .setDescription(`🎉 **${i.user.username}** foi o mais rápido e resgatou **${amount}** Kakeras!`);

            await i.update({ embeds: [successEmbed], components: [] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                dropMsg.edit({ content: '⏳ O Kakera desapareceu nas sombras...', components: [], embeds: [] }).catch(() => {});
            }
        });
    }
};
