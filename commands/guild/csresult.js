const { getData, saveData } = require('../../database');

module.exports = {
    name: 'csresult',
    aliases: ['cs-result', 'csresultado'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor`!');
        }

        if (!args.length) {
            return message.reply(
                '🏆 **CS2 — Resultados de Partidas:**\n\n' +
                '`n!csresult channel #canal` — define o canal\n' +
                '`n!csresult tier a/b/c/all` — filtra por nível (a=top, all=todas)\n' +
                '`n!csresult test` — envia um resultado de teste\n' +
                '`n!csresult debug` — mostra o que a API está retornando\n' +
                '`n!csresult reset` — limpa o cache de notificações\n' +
                '`n!csresult status` — mostra a configuração atual\n' +
                '`n!csresult remove` — para as notificações'
            );
        }

        const config = await getData('csResultConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = { tier: 'all' };

        const action = args[0].toLowerCase();

        if (action === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal válido!');
            config[guildId].channelId = channel.id;
            await saveData('csResultConfig.json', config);
            return message.reply(`✅ Alertas de **resultados de CS2** serão enviados para ${channel}!`);

        } else if (action === 'tier') {
            const val = args[1]?.toLowerCase();
            if (!val || !['a', 'b', 'c', 'd', 'all'].includes(val)) {
                return message.reply('⚠️ Use `a` (S-Tier), `b` (A-Tier), `c` (B-Tier), `d` (C-Tier) ou `all` (todas).');
            }
            config[guildId].tier = val;
            const desc = { a: 'S-Tier (Major, PGL, BLAST)', b: 'A-Tier (ESL, FACEIT)', c: 'B-Tier (IEM, CCT)', d: 'C-Tier', all: 'Todas as partidas' };
            await saveData('csResultConfig.json', config);
            return message.reply(`✅ Agora filtrando por: **${desc[val]}**`);

        } else if (action === 'test') {
            const channelId = config[guildId]?.channelId;
            if (!channelId) return message.reply('⚠️ Configure o canal primeiro com `n!csresult channel #canal`!');
            const targetChannel = message.guild.channels.cache.get(channelId);
            if (!targetChannel) return message.reply('⚠️ Canal não encontrado!');

            const TOKEN = process.env.PANDASCORE_TOKEN;
            try {
                const r = await fetch('https://api.pandascore.co/csgo/matches/past?sort=-modified_at&per_page=5', {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                const matches = await r.json();
                const match = matches.find(m => m.winner && m.status === 'finished');
                if (!match) {
                    return message.reply('⚠️ Nenhum resultado disponível para testar no momento.');
                }
                const { sendMatchEmbed } = require('../../csEmbeds');
                await sendMatchEmbed(targetChannel, match, 'result');
                return message.reply(`✅ Resultado de teste enviado em ${targetChannel}!`);
            } catch (e) {
                return message.reply('❌ Erro ao buscar resultado para teste: ' + e.message);
            }

        } else if (action === 'debug') {
            const TOKEN = process.env.PANDASCORE_TOKEN;
            if (!TOKEN) return message.reply('❌ `PANDASCORE_TOKEN` não está definido no `.env`!');
            try {
                const r = await fetch('https://api.pandascore.co/csgo/matches/past?sort=-modified_at&per_page=20', {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                if (!r.ok) return message.reply(`❌ PandaScore retornou HTTP ${r.status}. Verifique o token.`);
                const matches = await r.json();
                if (!Array.isArray(matches)) return message.reply('❌ PandaScore retornou uma resposta inesperada: ' + JSON.stringify(matches).slice(0, 200));

                const csState = await getData('csAlertsState.json');
                const notified = csState.resultNotified || {};
                const withWinner = matches.filter(m => m.winner);
                const newOnes = withWinner.filter(m => !notified[`${message.guild.id}_${m.id}`]);

                return message.reply(
                    `📊 **Debug — Loop de Resultados:**\n\n` +
                    `🔢 Partidas retornadas pela API: **${matches.length}**\n` +
                    `🏆 Com vencedor: **${withWinner.length}**\n` +
                    `🔕 Já notificadas (cache): **${withWinner.length - newOnes.length}**\n` +
                    `✅ Novas (seriam enviadas): **${newOnes.length}**\n\n` +
                    (newOnes.length === 0
                        ? '⚠️ Todas as partidas já foram notificadas! Use `n!csresult reset` para limpar o cache.'
                        : `Próxima: **${newOnes[0]?.opponents?.[0]?.opponent?.name || '?'} vs ${newOnes[0]?.opponents?.[1]?.opponent?.name || '?'}**`)
                );
            } catch (e) {
                return message.reply('❌ Erro no debug: ' + e.message);
            }

        } else if (action === 'reset') {
            try {
                const csState = await getData('csAlertsState.json');
                const before = Object.keys(csState.resultNotified || {}).length;
                csState.resultNotified = {};
                csState.liveNotified = {};
                await saveData('csAlertsState.json', csState);
                return message.reply(`✅ Cache de notificações limpo! (${before} entradas removidas)\n⏳ O próximo ciclo do loop (~60s) vai reenviar os resultados recentes.`);
            } catch (e) {
                return message.reply('❌ Erro ao resetar: ' + e.message);
            }

        } else if (action === 'status') {
            const c = config[guildId];
            const ch = c?.channelId ? `<#${c.channelId}>` : '❌ Não configurado';
            return message.reply(
                `📊 **Status — Resultados:**\n\n` +
                `📺 Canal: ${ch}\n` +
                `⭐ Tier: **${c?.tier === 'all' ? 'Todas' : (c?.tier || 'all').toUpperCase()}**`
            );

        } else if (action === 'remove') {
            delete config[guildId];
            await saveData('csResultConfig.json', config);
            return message.reply('🗑️ Alertas de resultados removidos!');

        } else {
            return message.reply('⚠️ Ação inválida. Use `n!csresult` para ver os comandos.');
        }
    }
};
