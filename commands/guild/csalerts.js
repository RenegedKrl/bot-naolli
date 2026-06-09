const { getData, saveData } = require('../../database');

module.exports = {
    name: 'csalerts',
    aliases: ['cs-alerts', 'csnoticias'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor` para configurar os alertas de CS!');
        }

        if (!args.length) {
            return message.reply(
                '⚙️ **Configuração de Alertas de CS2/CS:GO:**\n\n' +
                '`n!csalerts channel #canal` - Define o canal onde os alertas serão enviados\n' +
                '`n!csalerts matches on/off` - Liga/desliga alertas de partidas ao vivo\n' +
                '`n!csalerts results on/off` - Liga/desliga alertas de resultados\n' +
                '`n!csalerts news on/off` - Liga/desliga alertas de notícias da HLTV\n' +
                '`n!csalerts tier a/b/c/all` - Filtra partidas por nível (a=top, all=todas)\n' +
                '`n!csalerts status` - Mostra a configuração atual\n' +
                '`n!csalerts remove` - Remove todos os alertas'
            );
        }

        let config = await getData('csAlertsConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = { matchAlerts: true, resultAlerts: true, newsAlerts: true, tier: 'all' };

        const action = args[0].toLowerCase();

        if (action === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal válido!');
            config[guildId].channelId = channel.id;
            message.reply(`✅ Alertas de CS2 serão enviados para ${channel}!`);
        } else if (action === 'matches') {
            const val = args[1]?.toLowerCase();
            if (!val || !['on', 'off'].includes(val)) return message.reply('⚠️ Use `on` ou `off`.');
            config[guildId].matchAlerts = val === 'on';
            message.reply(`✅ Alertas de partidas ao vivo: **${val === 'on' ? 'Ligado 🟢' : 'Desligado 🔴'}**`);
        } else if (action === 'results') {
            const val = args[1]?.toLowerCase();
            if (!val || !['on', 'off'].includes(val)) return message.reply('⚠️ Use `on` ou `off`.');
            config[guildId].resultAlerts = val === 'on';
            message.reply(`✅ Alertas de resultados: **${val === 'on' ? 'Ligado 🟢' : 'Desligado 🔴'}**`);
        } else if (action === 'news') {
            const val = args[1]?.toLowerCase();
            if (!val || !['on', 'off'].includes(val)) return message.reply('⚠️ Use `on` ou `off`.');
            config[guildId].newsAlerts = val === 'on';
            message.reply(`✅ Alertas de notícias HLTV: **${val === 'on' ? 'Ligado 🟢' : 'Desligado 🔴'}**`);
        } else if (action === 'tier') {
            const val = args[1]?.toLowerCase();
            if (!val || !['a', 'b', 'c', 'd', 'all'].includes(val)) return message.reply('⚠️ Use `a`, `b`, `c`, `d` ou `all`.');
            config[guildId].tier = val;
            const desc = { a: 'S-Tier (Major, PGL, BLAST)', b: 'A-Tier (ESL, FACEIT)', c: 'B-Tier (IEM, CCT)', d: 'C-Tier', all: 'Todas as partidas' };
            message.reply(`✅ Filtrando por tier: **${desc[val]}**`);
        } else if (action === 'status') {
            const c = config[guildId];
            const ch = c.channelId ? `<#${c.channelId}>` : '❌ Não configurado';
            return message.reply(
                `📊 **Status dos Alertas de CS2:**\n\n` +
                `📺 Canal: ${ch}\n` +
                `🎮 Partidas ao vivo: ${c.matchAlerts ? '🟢 On' : '🔴 Off'}\n` +
                `🏆 Resultados: ${c.resultAlerts ? '🟢 On' : '🔴 Off'}\n` +
                `📰 Notícias HLTV: ${c.newsAlerts ? '🟢 On' : '🔴 Off'}\n` +
                `⭐ Tier mínimo: **${c.tier === 'all' ? 'Todas' : c.tier.toUpperCase()}**`
            );
        } else if (action === 'remove') {
            delete config[guildId];
            message.reply('🗑️ Todos os alertas de CS2 foram removidos deste servidor!');
        } else {
            return message.reply('⚠️ Ação inválida. Use `n!csalerts` para ver os comandos disponíveis.');
        }

        await saveData('csAlertsConfig.json', config);
    }
};
