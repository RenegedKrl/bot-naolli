const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'coinflip',
    aliases: ['cf', 'caraoucoroa'],
    description: 'Aposte Kakeras no Cara ou Coroa! (50/50 para dobrar).',
    async execute(message, args) {
        if (args.length < 2 || !['cara', 'coroa'].includes(args[0].toLowerCase()) || isNaN(args[1]) || parseInt(args[1]) <= 0) {
            return message.reply('⚠️ Formato incorreto! Use: `n!coinflip <cara/coroa> <valor>`\nExemplo: `n!coinflip cara 100`');
        }

        const escolha = args[0].toLowerCase();
        const aposta = parseInt(args[1]);
        const guildId = message.guild.id;
        const userId = message.author.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId] || !kakeraConfig[guildId][userId] || kakeraConfig[guildId][userId].balance < aposta) {
            return message.reply(`❌ Você não tem **${aposta} Kakeras** para apostar!`);
        }

        // Tira o dinheiro
        kakeraConfig[guildId][userId].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        const faces = ['cara', 'coroa'];
        const resultado = faces[Math.floor(Math.random() * faces.length)];

        let ganhou = (escolha === resultado);
        let color = '#FF0000';
        let texto = `🪙 A moeda caiu em **${resultado.toUpperCase()}**!\n\nVocê perdeu **${aposta}** Kakeras.`;

        if (ganhou) {
            const ganho = aposta * 2;
            kakeraConfig[guildId][userId].balance += ganho;
            await saveData('kakeraConfig.json', kakeraConfig);
            color = '#00FF00';
            texto = `🪙 A moeda caiu em **${resultado.toUpperCase()}**!\n\n🎉 Parabéns! Você dobrou e ganhou **${ganho}** Kakeras!`;
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🪙 Cara ou Coroa')
            .setDescription(texto)
            .setFooter({ text: `Saldo Atual: ${kakeraConfig[guildId][userId].balance} K` });

        message.reply({ embeds: [embed] });
    }
};
