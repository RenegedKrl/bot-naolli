const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const HORSES = [
    { name: 'Trovão', emoji: '⚡', speed: 7 },
    { name: 'Sombra', emoji: '🌑', speed: 6 },
    { name: 'Tornado', emoji: '🌪️', speed: 8 },
    { name: 'Diamante', emoji: '💎', speed: 5 },
    { name: 'Foguete', emoji: '🚀', speed: 6 },
];

module.exports = {
    name: 'corrida',
    aliases: ['race', 'hipodrome', 'apostar'],
    description: 'Aposte em corridas de cavalos! Rodada aberta por 30s.',
    async execute(message, args) {
        if (!args[0] || isNaN(parseInt(args[0])) || parseInt(args[0]) <= 0 || !args[1]) {
            const horseList = HORSES.map((h, i) => `**${i + 1}.** ${h.emoji} ${h.name}`).join('\n');
            return message.reply(`⚠️ Use: \`n!corrida <valor> <número_do_cavalo>\`\n\n${horseList}`);
        }

        const guildId = message.guild.id;
        const aposta = parseInt(args[0]);
        const horseIndex = parseInt(args[1]) - 1;

        if (horseIndex < 0 || horseIndex >= HORSES.length) {
            return message.reply(`❌ Escolha um cavalo de 1 a ${HORSES.length}!`);
        }

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]?.[message.author.id] || kakeraConfig[guildId][message.author.id].balance < aposta) {
            return message.reply(`❌ Você não tem **${aposta} Kakeras**!`);
        }

        // Coleta apostas por 30s
        let bets = {};
        bets[message.author.id] = { aposta, horseIndex };
        kakeraConfig[guildId][message.author.id].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        const horseList = HORSES.map((h, i) => `**${i + 1}.** ${h.emoji} ${h.name}`).join('\n');
        const raceMsg = await message.channel.send({
            embeds: [new EmbedBuilder()
                .setColor('#8B4513')
                .setTitle('🏇 Corrida de Cavalos — Apostas Abertas!')
                .setDescription(`${horseList}\n\nUse \`n!corrida <valor> <número>\` para apostar!\n*Corrida começa em 30 segundos!*`)
                .setFooter({ text: '🟢 Apostas abertas' })
            ]
        });

        // Espera mais apostas
        await new Promise(r => setTimeout(r, 30000));

        // Simula a corrida
        const positions = HORSES.map((h, i) => ({ ...h, index: i, progress: 0 }));
        const TRACK = 20;
        let raceLog = '';

        for (let frame = 0; frame < 100; frame++) {
            for (const h of positions) {
                const speed = h.speed + Math.random() * 4 - 1;
                h.progress = Math.min(TRACK, h.progress + speed * 0.3);
            }
            if (positions.some(h => h.progress >= TRACK)) break;
        }

        positions.sort((a, b) => b.progress - a.progress);
        const winner = positions[0];

        const trackDisplay = positions.map((h, rank) => {
            const pos = Math.floor(h.progress);
            const track = '─'.repeat(pos) + h.emoji + '─'.repeat(Math.max(0, TRACK - pos));
            return `${rank + 1}º ${track} ${h.name}`;
        }).join('\n');

        // Paga os vencedores
        kakeraConfig = await getData('kakeraConfig.json') || {};
        const winners = Object.entries(bets).filter(([, b]) => b.horseIndex === winner.index);
        const loserTotal = Object.entries(bets).filter(([, b]) => b.horseIndex !== winner.index).reduce((s, [, b]) => s + b.aposta, 0);
        const winnerPoolEach = winners.length > 0 ? Math.floor(loserTotal / winners.length) : 0;

        for (const [uid, bet] of winners) {
            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            if (!kakeraConfig[guildId][uid]) kakeraConfig[guildId][uid] = { balance: 0, badges: [] };
            kakeraConfig[guildId][uid].balance += bet.aposta + winnerPoolEach;
        }
        await saveData('kakeraConfig.json', kakeraConfig);

        const resultEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`🏆 Corrida Terminada! Vencedor: ${winner.emoji} ${winner.name}`)
            .setDescription(`\`\`\`\n${trackDisplay}\n\`\`\``)
            .addFields({ name: '🎉 Prêmio por vencedor:', value: winners.length ? `${winnerPoolEach} Kakeras extras + aposta devolvida!` : 'Ninguém apostou no vencedor!' });

        raceMsg.edit({ embeds: [resultEmbed] });
    }
};
