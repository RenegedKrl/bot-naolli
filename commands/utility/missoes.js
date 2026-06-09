const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const DAILY_QUESTS = [
    { id: 'q_roll5', name: '🎲 Rolar 5 vezes', desc: 'Use n!w 5 vezes hoje.', target: 5, type: 'rolls', reward: 150 },
    { id: 'q_battle3', name: '⚔️ Vencer 3 batalhas', desc: 'Vença 3 batalhas RPG hoje.', target: 3, type: 'battles', reward: 200 },
    { id: 'q_slots3', name: '🎰 Jogar Slots 3x', desc: 'Use n!slots 3 vezes.', target: 3, type: 'slots', reward: 100 },
    { id: 'q_feed_pet', name: '🍖 Alimentar pet', desc: 'Alimente seu pet uma vez.', target: 1, type: 'pet_feed', reward: 80 },
    { id: 'q_quiz1', name: '🧠 Acertar 1 Quiz', desc: 'Ganhe 1 rodada do quiz de anime.', target: 1, type: 'quiz_win', reward: 120 },
    { id: 'q_message20', name: '💬 Enviar 20 msgs', desc: 'Envie 20 mensagens no servidor.', target: 20, type: 'messages', reward: 100 },
];

function getTodayQuests(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const hash = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const shuffled = [...DAILY_QUESTS].sort((a, b) => {
        const seedA = (hash * a.id.length * 9301 + 49297) % 233280;
        const seedB = (hash * b.id.length * 9301 + 49297) % 233280;
        return seedA - seedB;
    });
    return shuffled.slice(0, 3);
}

module.exports = {
    name: 'missoes',
    aliases: ['quests', 'daily', 'tarefas'],
    description: 'Missões diárias para ganhar Kakeras.',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const today = new Date().toISOString().slice(0, 10);

        let questData = await getData('questProgress.json') || {};
        if (!questData[guildId]) questData[guildId] = {};
        if (!questData[guildId][userId] || questData[guildId][userId].date !== today) {
            questData[guildId][userId] = { date: today, progress: {}, claimed: [] };
            await saveData('questProgress.json', questData);
        }

        const todayQuests = getTodayQuests(userId);
        const userData = questData[guildId][userId];

        if (args[0]?.toLowerCase() === 'resgatar' || args[0]?.toLowerCase() === 'claim') {
            const questIndex = parseInt(args[1]) - 1;
            const quest = todayQuests[questIndex];
            if (!quest) return message.reply('⚠️ Missão inválida! Use os números de 1 a 3.');
            if (userData.claimed.includes(quest.id)) return message.reply('✅ Você já resgatou essa missão hoje!');

            const progress = userData.progress[quest.type] || 0;
            if (progress < quest.target) return message.reply(`❌ Você ainda não completou essa missão! (${progress}/${quest.target})`);

            userData.claimed.push(quest.id);
            questData[guildId][userId] = userData;
            await saveData('questProgress.json', questData);

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [] };
            kakeraConfig[guildId][userId].balance += quest.reward;
            await saveData('kakeraConfig.json', kakeraConfig);

            return message.reply(`✅ Missão **${quest.name}** resgatada! +**${quest.reward} Kakeras**!`);
        }

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(`📋 Missões Diárias de ${message.author.username}`)
            .setDescription('Complete missões para ganhar Kakeras extras!\nUse `n!missoes resgatar <número>` para coletar.')
            .addFields(todayQuests.map((q, i) => {
                const progress = userData.progress[q.type] || 0;
                const done = userData.claimed.includes(q.id);
                const filled = Math.min(progress, q.target);
                const bar = '█'.repeat(Math.floor((filled / q.target) * 8)) + '░'.repeat(8 - Math.floor((filled / q.target) * 8));
                return {
                    name: `${done ? '✅' : (progress >= q.target ? '🔔' : '🔲')} ${i + 1}. ${q.name}`,
                    value: `${q.desc}\n\`${bar}\` ${progress}/${q.target}\n💎 +${q.reward} Kakeras`,
                    inline: false
                };
            }))
            .setFooter({ text: `Renova à meia-noite! (${today})` });

        message.reply({ embeds: [embed] });
    }
};

module.exports.updateQuestProgress = async function(guildId, userId, type, amount = 1) {
    const today = new Date().toISOString().slice(0, 10);
    let questData = await getData('questProgress.json') || {};
    if (!questData[guildId]) questData[guildId] = {};
    if (!questData[guildId][userId] || questData[guildId][userId].date !== today) {
        questData[guildId][userId] = { date: today, progress: {}, claimed: [] };
    }
    questData[guildId][userId].progress[type] = (questData[guildId][userId].progress[type] || 0) + amount;
    await saveData('questProgress.json', questData);
};
