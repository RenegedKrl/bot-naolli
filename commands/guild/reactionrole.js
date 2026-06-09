const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'reactionrole',
    aliases: ['rr', 'reactrole'],
    description: 'Cria um painel de auto-cargo por reação. (Admin)',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageRoles')) {
            return message.reply('❌ Você precisa de **Gerenciar Cargos** para usar isso.');
        }

        const sub = args[0]?.toLowerCase();
        const guildId = message.guild.id;

        if (sub === 'criar' || sub === 'create') {
            // n!rr criar <título> | @cargo1 Emoji1 Descrição1 | @cargo2 Emoji2 Descrição2
            const full = args.slice(1).join(' ');
            const parts = full.split('|').map(p => p.trim()).filter(Boolean);

            if (parts.length < 2) {
                return message.reply('⚠️ Formato: `n!rr criar Título | @Cargo 🎮 Gamers | @Cargo 🎨 Arte`');
            }

            const title = parts[0];
            const roleParts = parts.slice(1);
            const buttons = [];
            const roleMap = {};

            for (const part of roleParts) {
                const tokens = part.trim().split(' ');
                const roleMention = tokens[0];
                const emoji = tokens[1];
                const desc = tokens.slice(2).join(' ') || 'Cargo';

                const roleId = roleMention.replace(/[<@&>]/g, '');
                const role = message.guild.roles.cache.get(roleId);
                if (!role) continue;

                const customId = `rr_${role.id}`;
                roleMap[customId] = role.id;

                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(customId)
                        .setLabel(`${emoji} ${desc}`)
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            if (buttons.length === 0) return message.reply('❌ Nenhum cargo válido encontrado!');

            const rows = [];
            for (let i = 0; i < buttons.length; i += 5) {
                rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            }

            const embed = new EmbedBuilder()
                .setColor('#4169E1')
                .setTitle(`🎭 ${title}`)
                .setDescription('Clique nos botões abaixo para pegar/remover um cargo automaticamente!')
                .setFooter({ text: 'Clique novamente para remover o cargo.' });

            const rrMsg = await message.channel.send({ embeds: [embed], components: rows });

            // Salva o mapeamento
            let rrData = await getData('reactionRoles.json') || {};
            if (!rrData[guildId]) rrData[guildId] = {};
            rrData[guildId][rrMsg.id] = roleMap;
            await saveData('reactionRoles.json', rrData);

            message.reply(`✅ Painel de cargos criado! (ID: \`${rrMsg.id}\`)`);

        } else {
            message.reply('⚠️ Use: `n!rr criar <título> | @Cargo 🎮 Gamers | @Cargo 🎨 Arte`');
        }
    }
};
