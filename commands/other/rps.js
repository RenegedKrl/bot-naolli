const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'rps',
    aliases: ['jokenpo', 'ppt'],
    async execute(message, args) {
        const choices = ['pedra', 'papel', 'tesoura'];
        const userChoice = args[0]?.toLowerCase();
        
        if (!choices.includes(userChoice)) {
            return message.reply('⚠️ Escolha: `pedra`, `papel` ou `tesoura`! Ex: `n!rps pedra`');
        }

        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        let result = '';

        if (userChoice === botChoice) result = 'Empate! 🤝';
        else if (
            (userChoice === 'pedra' && botChoice === 'tesoura') ||
            (userChoice === 'papel' && botChoice === 'pedra') ||
            (userChoice === 'tesoura' && botChoice === 'papel')
        ) {
            result = 'Você ganhou! 🎉';
        } else {
            result = 'Eu ganhei! 🤖';
        }

        const emojis = { pedra: '🪨', papel: '📄', tesoura: '✂️' };

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('Pedra, Papel, Tesoura!')
            .setDescription(`Você escolheu: **${userChoice}** ${emojis[userChoice]}\nEu escolhi: **${botChoice}** ${emojis[botChoice]}\n\n**Resultado:** ${result}`);
            
        message.reply({ embeds: [embed] });
    }
};
