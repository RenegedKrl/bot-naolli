const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'clan',
    aliases: ['guilda', 'guild'],
    description: 'Sistema de Clãs do servidor.',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        let clans = await getData('clans.json') || {};
        if (!clans[guildId]) clans[guildId] = {};

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'lista') {
            const clanList = Object.values(clans[guildId]);
            const embed = new EmbedBuilder()
                .setColor('#4169E1')
                .setTitle('⚔️ Clãs do Servidor')
                .setDescription(clanList.length ? clanList.map(c => `${c.emoji || '🏰'} **${c.name}** — ${c.members.length} membros | ${c.level} Nível | Líder: <@${c.leaderId}>`).join('\n') : '*Nenhum clã existe ainda! Crie o primeiro com `n!clan criar <nome> <emoji>`*')
                .setFooter({ text: 'Use n!clan criar para criar o seu.' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'criar' || sub === 'create') {
            if (args.length < 2) return message.reply('⚠️ Use: `n!clan criar <nome> [emoji]`');

            // Verifica se já está em um clã
            const existingClan = Object.values(clans[guildId]).find(c => c.members.includes(userId));
            if (existingClan) return message.reply(`❌ Você já faz parte do clã **${existingClan.name}**! Saia primeiro com \`n!clan sair\`.`);

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            const createCost = 1000;
            if (!kakeraConfig[guildId]?.[userId] || kakeraConfig[guildId][userId].balance < createCost) {
                return message.reply(`❌ Criar um clã custa **${createCost} Kakeras**!`);
            }

            const clanEmoji = /^\p{Emoji}/u.test(args[args.length - 1]) ? args[args.length - 1] : '🏰';
            const clanName = args.slice(1).join(' ').replace(clanEmoji, '').trim();
            
            if (Object.values(clans[guildId]).find(c => c.name.toLowerCase() === clanName.toLowerCase())) {
                return message.reply('❌ Já existe um clã com esse nome!');
            }

            kakeraConfig[guildId][userId].balance -= createCost;
            await saveData('kakeraConfig.json', kakeraConfig);

            const clanId = `${userId}_${Date.now()}`;
            clans[guildId][clanId] = {
                id: clanId, name: clanName, emoji: clanEmoji,
                leaderId: userId, members: [userId],
                level: 1, xp: 0, xpNeeded: 500,
                description: 'Um clã poderoso está nascendo!',
                bank: 0, createdAt: Date.now()
            };
            await saveData('clans.json', clans);

            message.reply(`✅ Clã **${clanEmoji} ${clanName}** criado com sucesso! Agora recrute membros com \`n!clan convidar @usuario\`.`);
        }

        else if (sub === 'info') {
            const clanName = args.slice(1).join(' ');
            const clan = clanName
                ? Object.values(clans[guildId]).find(c => c.name.toLowerCase().includes(clanName.toLowerCase()))
                : Object.values(clans[guildId]).find(c => c.members.includes(userId));

            if (!clan) return message.reply('❌ Clã não encontrado! Use `n!clan lista` para ver os clãs disponíveis.');

            const xpBar = '█'.repeat(Math.floor((clan.xp / clan.xpNeeded) * 10)) + '░'.repeat(10 - Math.floor((clan.xp / clan.xpNeeded) * 10));
            const embed = new EmbedBuilder()
                .setColor('#4169E1')
                .setTitle(`${clan.emoji} Clã: ${clan.name}`)
                .setDescription(clan.description)
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.leaderId}>`, inline: true },
                    { name: '👥 Membros', value: `${clan.members.length}`, inline: true },
                    { name: '🏆 Nível', value: `${clan.level}`, inline: true },
                    { name: '💰 Banco do Clã', value: `${clan.bank} Kakeras`, inline: true },
                    { name: '✨ XP do Clã', value: `\`${xpBar}\` ${clan.xp}/${clan.xpNeeded}`, inline: false }
                );
            return message.reply({ embeds: [embed] });
        }

        else if (sub === 'convidar' || sub === 'invite') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('⚠️ Use: `n!clan convidar @usuario`');

            const myClan = Object.values(clans[guildId]).find(c => c.leaderId === userId);
            if (!myClan) return message.reply('❌ Você precisa ser líder de um clã para convidar membros!');
            if (myClan.members.includes(target.id)) return message.reply('❌ Esta pessoa já está no seu clã!');
            if (Object.values(clans[guildId]).find(c => c.members.includes(target.id))) {
                return message.reply('❌ Esta pessoa já está em outro clã!');
            }

            const inviteMsg = await message.channel.send(`${clan_emoji || '🏰'} **${message.author.username}** está convidando **${target}** para o clã **${myClan.name}**!\n${target}, reaja com ✅ para entrar ou ❌ para recusar. (30s)`
                .replace(/clan_emoji/g, myClan.emoji));
            await inviteMsg.react('✅');
            await inviteMsg.react('❌');

            const filter = (r, u) => ['✅', '❌'].includes(r.emoji.name) && u.id === target.id;
            const collected = await inviteMsg.awaitReactions({ filter, time: 30000, max: 1 });
            
            if (!collected.size || collected.first().emoji.name === '❌') {
                return inviteMsg.edit(`❌ **${target.username}** recusou o convite.`);
            }

            clans[guildId][myClan.id].members.push(target.id);
            clans[guildId][myClan.id].xp += 50;

            if (clans[guildId][myClan.id].xp >= clans[guildId][myClan.id].xpNeeded) {
                clans[guildId][myClan.id].xp -= clans[guildId][myClan.id].xpNeeded;
                clans[guildId][myClan.id].level++;
                clans[guildId][myClan.id].xpNeeded = clans[guildId][myClan.id].level * 500;
                message.channel.send(`🆙 O clã **${myClan.name}** subiu para o nível **${clans[guildId][myClan.id].level}**!`);
            }

            await saveData('clans.json', clans);
            inviteMsg.edit(`✅ **${target.username}** entrou no clã **${myClan.emoji} ${myClan.name}**! Bem-vindo!`);
        }

        else if (sub === 'depositar' || sub === 'deposit') {
            const amount = parseInt(args[1]);
            if (!amount || amount <= 0) return message.reply('⚠️ Use: `n!clan depositar <valor>`');

            const myClan = Object.values(clans[guildId]).find(c => c.members.includes(userId));
            if (!myClan) return message.reply('❌ Você não está em nenhum clã!');

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]?.[userId] || kakeraConfig[guildId][userId].balance < amount) {
                return message.reply(`❌ Você não tem **${amount} Kakeras**!`);
            }

            kakeraConfig[guildId][userId].balance -= amount;
            await saveData('kakeraConfig.json', kakeraConfig);

            clans[guildId][myClan.id].bank += amount;
            clans[guildId][myClan.id].xp += Math.floor(amount / 10);
            await saveData('clans.json', clans);

            message.reply(`💰 Você depositou **${amount} Kakeras** no banco do clã **${myClan.name}**! Banco: ${clans[guildId][myClan.id].bank} K`);
        }

        else if (sub === 'sair' || sub === 'leave') {
            const myClan = Object.values(clans[guildId]).find(c => c.members.includes(userId));
            if (!myClan) return message.reply('❌ Você não está em nenhum clã!');
            if (myClan.leaderId === userId) return message.reply('❌ Você é o líder! Dissolva o clã com `n!clan dissolver` ou transfira a liderança.');

            clans[guildId][myClan.id].members = clans[guildId][myClan.id].members.filter(m => m !== userId);
            await saveData('clans.json', clans);
            message.reply(`👋 Você saiu do clã **${myClan.emoji} ${myClan.name}**.`);
        }

        else if (sub === 'dissolver' || sub === 'delete') {
            const myClan = Object.values(clans[guildId]).find(c => c.leaderId === userId);
            if (!myClan) return message.reply('❌ Você não é líder de nenhum clã!');

            // Devolve o banco para o líder
            if (myClan.bank > 0) {
                let kakeraConfig = await getData('kakeraConfig.json') || {};
                if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
                if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [] };
                kakeraConfig[guildId][userId].balance += myClan.bank;
                await saveData('kakeraConfig.json', kakeraConfig);
            }

            delete clans[guildId][myClan.id];
            await saveData('clans.json', clans);
            message.reply(`💥 O clã **${myClan.emoji} ${myClan.name}** foi dissolvido. O banco (${myClan.bank} K) foi devolvido a você.`);
        }
    }
};
