const { getData, saveData } = require('../../database');

module.exports = {
    name: 'csmatch',
    aliases: ['cs-match', 'cspartida'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor`!');
        }

        if (!args.length) {
            return message.reply(
                '🎮 **CS2 — Partidas Ao Vivo:**\n\n' +
                '`n!csmatch channel #canal` — define o canal\n' +
                '`n!csmatch tier a/b/c/all` — filtra por nível (a=top, all=todas)\n' +
                '`n!csmatch test` — envia um alerta de teste\n' +
                '`n!csmatch status` — mostra a configuração atual\n' +
                '`n!csmatch remove` — para as notificações'
            );
        }

        const config = await getData('csMatchConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = { tier: 'all' };

        const action = args[0].toLowerCase();

        if (action === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal válido!');
            config[guildId].channelId = channel.id;
            await saveData('csMatchConfig.json', config);
            return message.reply(`✅ Alertas de **partidas ao vivo de CS2** serão enviados para ${channel}!`);

        } else if (action === 'tier') {
            const val = args[1]?.toLowerCase();
            if (!val || !['a', 'b', 'c', 'd', 'all'].includes(val)) {
                return message.reply('⚠️ Use `a` (S-Tier), `b` (A-Tier), `c` (B-Tier), `d` (C-Tier) ou `all` (todas).');
            }
            config[guildId].tier = val;
            const desc = { a: 'S-Tier (Major, PGL, BLAST)', b: 'A-Tier (ESL, FACEIT)', c: 'B-Tier (IEM, CCT)', d: 'C-Tier', all: 'Todas as partidas' };
            await saveData('csMatchConfig.json', config);
            return message.reply(`✅ Agora filtrando por: **${desc[val]}**`);

        } else if (action === 'test') {
            const channelId = config[guildId]?.channelId;
            if (!channelId) return message.reply('⚠️ Configure o canal primeiro com `n!csmatch channel #canal`!');
            const targetChannel = message.guild.channels.cache.get(channelId);
            if (!targetChannel) return message.reply('⚠️ Canal não encontrado!');

            // Busca uma partida real da API pra testar
            const TOKEN = process.env.PANDASCORE_TOKEN;
            try {
                const r = await fetch('https://api.pandascore.co/csgo/matches/upcoming?sort=begin_at&per_page=1', {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                const matches = await r.json();
                if (!matches.length || !matches[0].opponents?.length) {
                    return message.reply('⚠️ Nenhuma partida futura encontrada no momento para testar.');
                }
                const { sendMatchEmbed } = require('../../csEmbeds');
                await sendMatchEmbed(targetChannel, matches[0], 'live');
                return message.reply(`✅ Alerta de teste enviado em ${targetChannel}!`);
            } catch (e) {
                return message.reply('❌ Erro ao buscar partida para teste: ' + e.message);
            }

        } else if (action === 'status') {
            const c = config[guildId];
            const ch = c?.channelId ? `<#${c.channelId}>` : '❌ Não configurado';
            return message.reply(
                `📊 **Status — Partidas Ao Vivo:**\n\n` +
                `📺 Canal: ${ch}\n` +
                `⭐ Tier: **${c?.tier === 'all' ? 'Todas' : (c?.tier || 'all').toUpperCase()}**`
            );

        } else if (action === 'remove') {
            delete config[guildId];
            await saveData('csMatchConfig.json', config);
            return message.reply('🗑️ Alertas de partidas ao vivo removidos!');

        } else {
            return message.reply('⚠️ Ação inválida. Use `n!csmatch` para ver os comandos.');
        }
    }
};
