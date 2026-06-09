const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'adivinhar',
    aliases: ['guess', 'numero'],
    description: 'Adivinhe o número secreto e ganhe Kakeras!',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        const aposta = parseInt(args[0]);
        if (!aposta || aposta < 10) return message.reply('⚠️ Use: `n!adivinhar <aposta mínima 10K>`\nEx: `n!adivinhar 50`\n\nAdivinhe um número de 1 a 10. Se acertar, ganha **10x**!');

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]?.[userId] || kakeraConfig[guildId][userId].balance < aposta) {
            return message.reply(`❌ Você não tem **${aposta} Kakeras** para apostar!`);
        }

        kakeraConfig[guildId][userId].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        const secret = Math.floor(Math.random() * 10) + 1;
        let attempts = 3;
        let won = false;

        await message.reply(`🎯 Número secreto gerado! É um número de **1 a 10**.\nVocê tem **${attempts} tentativas**. Digite seu palpite no chat!`);

        const filter = m => m.author.id === userId && !isNaN(m.content) && parseInt(m.content) >= 1 && parseInt(m.content) <= 10;
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: attempts });

        collector.on('collect', async m => {
            const guess = parseInt(m.content);
            attempts--;

            if (guess === secret) {
                won = true;
                collector.stop('win');
            } else if (attempts === 0) {
                collector.stop('lose');
            } else {
                const hint = guess < secret ? '⬆️ Mais alto!' : '⬇️ Mais baixo!';
                m.reply(`${hint} Restam **${attempts}** tentativa(s).`);
            }
        });

        collector.on('end', async (_, reason) => {
            kakeraConfig = await getData('kakeraConfig.json') || {};
            if (reason === 'win') {
                const prize = aposta * 10;
                kakeraConfig[guildId][userId].balance += prize;
                await saveData('kakeraConfig.json', kakeraConfig);

                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🎯 ACERTOU!')
                    .setDescription(`O número era **${secret}** e você adivinhou!\n\n💎 Você ganhou **${prize} Kakeras** (10x a aposta)!\n💰 Saldo: ${kakeraConfig[guildId][userId].balance} K`);
                message.channel.send({ embeds: [embed] });
            } else if (reason === 'lose' || reason === 'time') {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(reason === 'time' ? '⏱️ Tempo Esgotado!' : '❌ Errou Tudo!')
                    .setDescription(`O número era **${secret}**. Você perdeu **${aposta} Kakeras**.\n💰 Saldo: ${kakeraConfig[guildId][userId].balance} K`);
                message.channel.send({ embeds: [embed] });
            }
        });
    }
};
