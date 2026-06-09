const { getData, saveData } = require('../../database');

module.exports = {
    name: 'csnews',
    aliases: ['cs-news', 'csnoticias'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor`!');
        }

        if (!args.length) {
            return message.reply(
                '📰 **CS2 — Notícias HLTV:**\n\n' +
                '`n!csnews channel #canal` — define o canal\n' +
                '`n!csnews test` — envia uma notícia de teste\n' +
                '`n!csnews status` — mostra a configuração atual\n' +
                '`n!csnews remove` — para as notificações'
            );
        }

        const config = await getData('csNewsConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = {};

        const action = args[0].toLowerCase();

        if (action === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal válido!');
            config[guildId].channelId = channel.id;
            await saveData('csNewsConfig.json', config);
            return message.reply(`✅ Notícias da **HLTV** serão enviadas para ${channel}!`);

        } else if (action === 'test') {
            const channelId = config[guildId]?.channelId;
            if (!channelId) return message.reply('⚠️ Configure o canal primeiro com `n!csnews channel #canal`!');
            const targetChannel = message.guild.channels.cache.get(channelId);
            if (!targetChannel) return message.reply('⚠️ Canal não encontrado!');

            try {
                const fetch = require('node-fetch'); // ou fetch nativo se Node 18+
                const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.hltv.org/rss/news');
                const json = await res.json();
                
                if (json.status !== 'ok' || !json.items || !json.items.length) {
                    return message.reply('⚠️ Nenhuma notícia disponível no momento.');
                }
                const { sendNewsEmbed } = require('../../csEmbeds');
                await sendNewsEmbed(targetChannel, json.items[0]);
                return message.reply(`✅ Notícia de teste enviada em ${targetChannel}!`);
            } catch (e) {
                return message.reply('❌ Erro ao buscar notícia: ' + e.message);
            }

        } else if (action === 'status') {
            const c = config[guildId];
            const ch = c?.channelId ? `<#${c.channelId}>` : '❌ Não configurado';
            return message.reply(
                `📊 **Status — Notícias HLTV:**\n\n` +
                `📺 Canal: ${ch}`
            );

        } else if (action === 'remove') {
            delete config[guildId];
            await saveData('csNewsConfig.json', config);
            return message.reply('🗑️ Alertas de notícias removidos!');

        } else {
            return message.reply('⚠️ Ação inválida. Use `n!csnews` para ver os comandos.');
        }
    }
};
