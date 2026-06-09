const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'giveaway',
    aliases: ['sorteio'],
    description: 'Inicia um sorteio de Kakeras. (Apenas Admin/Mod)',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa de permissão de **Gerenciar Servidor** para usar este comando.');
        }

        // n!giveaway <duração em minutos> <prêmio em Kakeras> [mensagem]
        if (args.length < 2 || isNaN(args[0]) || isNaN(args[1])) {
            return message.reply('⚠️ Uso: `n!giveaway <minutos> <kakeras> [mensagem opcional]`\nEx: `n!giveaway 60 1000 Comemorando 100 membros!`');
        }

        const duracaoMs = parseInt(args[0]) * 60 * 1000;
        const premio = parseInt(args[1]);
        const mensagem = args.slice(2).join(' ') || '🎁 Sorteio de Kakeras!';
        const guildId = message.guild.id;

        const terminaEm = Date.now() + duracaoMs;

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 GIVEAWAY!')
            .setDescription(`**${mensagem}**\n\nPrêmio: 💎 **${premio} Kakeras**\n\nClique em 🎉 para participar!`)
            .addFields({ name: '⏳ Termina em:', value: `<t:${Math.floor(terminaEm / 1000)}:R>` })
            .setFooter({ text: `Organizado por ${message.author.username}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('giveaway_enter')
                .setLabel('🎉 Participar!')
                .setStyle(ButtonStyle.Success)
        );

        const giveawayMsg = await message.channel.send({ embeds: [embed], components: [row] });

        // Salva estado
        let giveaways = await getData('giveaways.json') || {};
        giveaways[giveawayMsg.id] = {
            messageId: giveawayMsg.id,
            channelId: message.channel.id,
            guildId,
            premio,
            organizerId: message.author.id,
            participants: [],
            terminaEm,
            active: true
        };
        await saveData('giveaways.json', giveaways);

        // Coleta participantes
        const collector = giveawayMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: duracaoMs
        });

        collector.on('collect', async i => {
            const giveaways = await getData('giveaways.json') || {};
            if (!giveaways[giveawayMsg.id]) return;

            if (giveaways[giveawayMsg.id].participants.includes(i.user.id)) {
                await i.reply({ content: '✅ Você já está participando!', ephemeral: true });
            } else {
                giveaways[giveawayMsg.id].participants.push(i.user.id);
                await saveData('giveaways.json', giveaways);
                await i.reply({ content: `🎉 Você entrou no sorteio! (${giveaways[giveawayMsg.id].participants.length} participantes)`, ephemeral: true });
            }
        });

        collector.on('end', async () => {
            let giveaways = await getData('giveaways.json') || {};
            if (!giveaways[giveawayMsg.id]) return;

            const gw = giveaways[giveawayMsg.id];
            if (!gw.participants.length) {
                const endEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('🎉 Sorteio Encerrado')
                    .setDescription('Ninguém participou... que triste! 😢');
                giveawayMsg.edit({ embeds: [endEmbed], components: [] });
                return;
            }

            const winnerId = gw.participants[Math.floor(Math.random() * gw.participants.length)];

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            if (!kakeraConfig[guildId][winnerId]) kakeraConfig[guildId][winnerId] = { balance: 0, badges: [] };
            kakeraConfig[guildId][winnerId].balance += gw.premio;
            await saveData('kakeraConfig.json', kakeraConfig);

            giveaways[giveawayMsg.id].active = false;
            await saveData('giveaways.json', giveaways);

            const winEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎉 SORTEIO ENCERRADO!')
                .setDescription(`🏆 Vencedor: <@${winnerId}>\n\n💎 **${gw.premio} Kakeras** foram transferidos para a conta do vencedor!\n\n*${gw.participants.length} pessoas participaram.*`);

            giveawayMsg.edit({ embeds: [winEmbed], components: [] });
            message.channel.send(`🎉 Parabéns <@${winnerId}>! Você ganhou **${gw.premio} Kakeras** no sorteio!`);
        });

        message.reply(`✅ Sorteio iniciado! Durará **${args[0]} minutos**.`);
    }
};
