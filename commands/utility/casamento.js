const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'casamento',
    aliases: ['marry', 'casar'],
    description: 'Case com outro usuário do servidor! Sistema de casamento social.',
    async execute(message, args) {
        const target = message.mentions.users.first();
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!args.length || !target) return message.reply('⚠️ Use: `n!casamento @usuario`\nSub-comandos: `n!casamento divorcio` | `n!casamento info`');

        if (args[0].toLowerCase() === 'divorcio') {
            let marriages = await getData('marriages.json') || {};
            if (!marriages[guildId]?.[userId]) return message.reply('❌ Você não está casado(a)!');

            const partnerId = marriages[guildId][userId].partnerId;
            delete marriages[guildId][userId];
            if (marriages[guildId]?.[partnerId]) delete marriages[guildId][partnerId];
            await saveData('marriages.json', marriages);

            return message.reply(`💔 Você se divorciou do(a) <@${partnerId}>. Que triste...`);
        }

        if (args[0].toLowerCase() === 'info') {
            let marriages = await getData('marriages.json') || {};
            const info = marriages[guildId]?.[userId];
            if (!info) return message.reply('❌ Você não está casado(a)! Use `n!casamento @usuario` para pedir em casamento.');

            const partner = await message.guild.members.fetch(info.partnerId).catch(() => null);
            const since = new Date(info.since).toLocaleDateString('pt-BR');
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('💍 Certidão de Casamento')
                .setDescription(`${message.author} e ${partner || `<@${info.partnerId}>`} estão juntos desde **${since}**!\n\n*"${info.mensagem || 'Para sempre juntos! 💕'}"*`);
            return message.reply({ embeds: [embed] });
        }

        if (target.bot) return message.reply('❌ Você não pode casar com um bot!');
        if (target.id === userId) return message.reply('❌ Você não pode casar com você mesmo!');

        let marriages = await getData('marriages.json') || {};
        if (!marriages[guildId]) marriages[guildId] = {};

        if (marriages[guildId][userId]) return message.reply(`❌ Você já está casado(a)! Use \`n!casamento divorcio\` primeiro.`);
        if (marriages[guildId][target.id]) return message.reply(`❌ **${target.username}** já está casado(a)!`);

        const proposalMsg = await message.channel.send({
            content: `💍 **${message.author.username}** está pedindo **${target}** em casamento!\n\n${target}, reaja com 💍 para aceitar ou 💔 para recusar. (60s)`
        });
        await proposalMsg.react('💍');
        await proposalMsg.react('💔');

        const filter = (r, u) => ['💍', '💔'].includes(r.emoji.name) && u.id === target.id;
        const collected = await proposalMsg.awaitReactions({ filter, time: 60000, max: 1 });

        if (!collected.size || collected.first().emoji.name === '💔') {
            return proposalMsg.edit(`💔 **${target.username}** recusou o pedido. Que dó...`);
        }

        // Pergunta a mensagem do casamento
        await message.channel.send(`✨ Que lindo! ${message.author} e ${target} vão se casar! \`${message.author.username}\`, escreva uma mensagem romântica para a certidão! (30s)`);

        const msgFilter = m => m.author.id === userId;
        const msgCollected = await message.channel.awaitMessages({ filter: msgFilter, time: 30000, max: 1 });
        const mensagem = msgCollected.first()?.content || 'Para sempre juntos! 💕';

        marriages[guildId][userId] = { partnerId: target.id, since: Date.now(), mensagem };
        marriages[guildId][target.id] = { partnerId: userId, since: Date.now(), mensagem };
        await saveData('marriages.json', marriages);

        // Bonus Kakera pelo casamento
        let kakeraConfig = await getData('kakeraConfig.json') || {};
        const bonus = 500;
        for (const id of [userId, target.id]) {
            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            if (!kakeraConfig[guildId][id]) kakeraConfig[guildId][id] = { balance: 0, badges: [] };
            kakeraConfig[guildId][id].balance += bonus;
        }
        await saveData('kakeraConfig.json', kakeraConfig);

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('💍 CASAMENTO REALIZADO!')
            .setDescription(`${message.author} e ${target} agora são casados!\n\n*"${mensagem}"*\n\n💎 Ambos receberam **${bonus} Kakeras** de presente de casamento!`);

        proposalMsg.edit({ content: '', embeds: [embed] });
    }
};
