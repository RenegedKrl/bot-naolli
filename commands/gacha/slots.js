const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const EMOJIS = ['🍒', '🍋', '🍇', '🍉', '⭐', '💎'];

module.exports = {
    name: 'slots',
    aliases: ['cassino', 'apostar', 'slot'],
    description: 'Aposte seus Kakeras no Caça-Níqueis!',
    async execute(message, args) {
        if (!args.length || isNaN(args[0]) || parseInt(args[0]) <= 0) {
            return message.reply('⚠️ Diga o valor da aposta! Ex: `n!slots 100`');
        }

        const aposta = parseInt(args[0]);
        const guildId = message.guild.id;
        const userId = message.author.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId] || !kakeraConfig[guildId][userId] || kakeraConfig[guildId][userId].balance < aposta) {
            return message.reply(`❌ Você não tem **${aposta} Kakeras** para apostar!`);
        }

        // Tira o dinheiro
        kakeraConfig[guildId][userId].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        // Roda os slots
        const slot1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        const slot2 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        const slot3 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

        let multiplicador = 0;
        let resultado = 'Perdeu... Tente novamente!';
        let color = '#FF0000';

        if (slot1 === slot2 && slot2 === slot3) {
            // Jackpot ou Trinca
            if (slot1 === '💎') multiplicador = 10;
            else if (slot1 === '⭐') multiplicador = 5;
            else multiplicador = 3;
            
            resultado = `🎉 **JACKPOT!** Você multiplicou sua aposta por **${multiplicador}x**!`;
            color = '#FFD700';
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
            // Dupla
            multiplicador = 1.5;
            resultado = `✨ **Quase!** Mas uma dupla te rendeu **1.5x**!`;
            color = '#00FF00';
        }

        const ganho = Math.floor(aposta * multiplicador);
        
        if (ganho > 0) {
            kakeraConfig[guildId][userId].balance += ganho;
            await saveData('kakeraConfig.json', kakeraConfig);
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎰 Caça-Níqueis do Naolli')
            .setDescription(`**[ ${slot1} | ${slot2} | ${slot3} ]**\n\n${resultado}`)
            .addFields(
                { name: 'Aposta:', value: `${aposta} Kakeras`, inline: true },
                { name: 'Retorno:', value: `${ganho} Kakeras`, inline: true },
                { name: 'Saldo Atual:', value: `${kakeraConfig[guildId][userId].balance} Kakeras`, inline: true }
            );

        message.reply({ embeds: [embed] });
    }
};
