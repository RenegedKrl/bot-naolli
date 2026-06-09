const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'automod',
    aliases: ['moderacao', 'filtro'],
    description: 'Configura a auto-moderação do servidor. (Admin)',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa de **Gerenciar Servidor** para usar isso.');
        }

        const guildId = message.guild.id;
        let automodData = await getData('automodConfig.json') || {};
        if (!automodData[guildId]) automodData[guildId] = { words: [], antiSpam: false, antiLink: false, warnChannel: null };

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const data = automodData[guildId];
            const embed = new EmbedBuilder()
                .setColor('#FF8C00')
                .setTitle('🛡️ Auto-Moderação — Status')
                .addFields(
                    { name: '🚫 Palavras Bloqueadas', value: data.words.length ? data.words.map(w => `\`${w}\``).join(', ') : '*Nenhuma*', inline: false },
                    { name: '🔄 Anti-Spam', value: data.antiSpam ? '✅ Ativado' : '❌ Desativado', inline: true },
                    { name: '🔗 Anti-Link', value: data.antiLink ? '✅ Ativado' : '❌ Desativado', inline: true },
                    { name: '📢 Canal de Avisos', value: data.warnChannel ? `<#${data.warnChannel}>` : '*Não configurado*', inline: true }
                )
                .setFooter({ text: 'Comandos: n!automod palavra <add/rem> <texto> | antispam | antilink | canal #canal' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'palavra' || sub === 'word') {
            const action = args[1]?.toLowerCase();
            const word = args.slice(2).join(' ').toLowerCase();
            if (!action || !word) return message.reply('⚠️ Use: `n!automod palavra add <palavra>` ou `n!automod palavra rem <palavra>`');

            if (action === 'add') {
                if (automodData[guildId].words.includes(word)) return message.reply('⚠️ Essa palavra já está na lista!');
                automodData[guildId].words.push(word);
                await saveData('automodConfig.json', automodData);
                return message.reply(`✅ Palavra \`${word}\` adicionada à lista de bloqueio.`);
            }
            if (action === 'rem' || action === 'remove') {
                automodData[guildId].words = automodData[guildId].words.filter(w => w !== word);
                await saveData('automodConfig.json', automodData);
                return message.reply(`✅ Palavra \`${word}\` removida da lista.`);
            }
        }

        if (sub === 'antispam') {
            automodData[guildId].antiSpam = !automodData[guildId].antiSpam;
            await saveData('automodConfig.json', automodData);
            return message.reply(`🔄 Anti-Spam **${automodData[guildId].antiSpam ? 'ativado' : 'desativado'}**!`);
        }

        if (sub === 'antilink') {
            automodData[guildId].antiLink = !automodData[guildId].antiLink;
            await saveData('automodConfig.json', automodData);
            return message.reply(`🔗 Anti-Link **${automodData[guildId].antiLink ? 'ativado' : 'desativado'}**!`);
        }

        if (sub === 'canal' || sub === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal! Ex: `n!automod canal #logs`');
            automodData[guildId].warnChannel = channel.id;
            await saveData('automodConfig.json', automodData);
            return message.reply(`📢 Canal de avisos de automod definido para ${channel}!`);
        }
    }
};
