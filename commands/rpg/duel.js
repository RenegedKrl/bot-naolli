const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'duel',
    aliases: ['duelo', 'desafiar'],
    description: 'Desafie outro usuário para um duelo de Kakeras!',
    async execute(message, args) {
        const opponent = message.mentions.users.first();
        if (!opponent || opponent.bot) return message.reply('⚠️ Mencione um usuário válido para duelar! Ex: `n!duel @usuario 200`');
        if (opponent.id === message.author.id) return message.reply('❌ Você não pode se duelar!');

        const aposta = parseInt(args[1]);
        if (!aposta || aposta <= 0) return message.reply('⚠️ Defina um valor de aposta! Ex: `n!duel @usuario 200`');

        const guildId = message.guild.id;
        const challengerId = message.author.id;
        const opponentId = opponent.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig[guildId][challengerId]) kakeraConfig[guildId][challengerId] = { balance: 0, badges: [] };
        if (!kakeraConfig[guildId][opponentId]) kakeraConfig[guildId][opponentId] = { balance: 0, badges: [] };

        if (kakeraConfig[guildId][challengerId].balance < aposta) return message.reply(`❌ Você não tem **${aposta} Kakeras**!`);
        if (kakeraConfig[guildId][opponentId].balance < aposta) return message.reply(`❌ **${opponent.username}** não tem **${aposta} Kakeras**!`);

        const challengeMsg = await message.channel.send({
            content: `⚔️ **${message.author.username}** desafia **${opponent}** para um duelo de **${aposta} Kakeras**!\n${opponent}, reaja com ✅ para aceitar ou ❌ para recusar. (30s)`,
        });

        await challengeMsg.react('✅');
        await challengeMsg.react('❌');

        const filter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === opponentId;
        const collected = await challengeMsg.awaitReactions({ filter, time: 30000, max: 1 });

        if (!collected.size || collected.first().emoji.name === '❌') {
            return challengeMsg.edit(`❌ **${opponent.username}** recusou o duelo!`);
        }

        // Sorteia o vencedor (com balanceamento por stats RPG)
        let rpg = await getData('rpgData.json') || {};
        const challengerStats = rpg[guildId]?.[challengerId] || { level: 1, atk: 20 };
        const opponentStats = rpg[guildId]?.[opponentId] || { level: 1, atk: 20 };

        const challengerScore = challengerStats.level * 10 + challengerStats.atk + Math.random() * 50;
        const opponentScore = opponentStats.level * 10 + opponentStats.atk + Math.random() * 50;

        const winnerId = challengerScore >= opponentScore ? challengerId : opponentId;
        const loserId = winnerId === challengerId ? opponentId : challengerId;
        const winnerName = winnerId === challengerId ? message.author.username : opponent.username;

        kakeraConfig[guildId][winnerId].balance += aposta;
        kakeraConfig[guildId][loserId].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('⚔️ Resultado do Duelo')
            .setDescription(`🏆 **${winnerName}** venceu o duelo!\n\n💎 +${aposta} Kakeras para o vencedor!\n💸 -${aposta} Kakeras para o perdedor.`)
            .setFooter({ text: 'O nível RPG influencia as chances de vitória!' });

        challengeMsg.edit({ content: '', embeds: [embed] });
    }
};
