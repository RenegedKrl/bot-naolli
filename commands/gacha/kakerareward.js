const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kakerareward',
    aliases: ['kr', 'kakerarewards'],
    description: 'Mostra as recompensas e preços das insígnias (badges) de Kakera.',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('💎 Recompensas de Kakera (Badges)')
            .setDescription('Use `n!kakera <nome da badge>` para comprar uma badge!\n\n' +
                '🥉 **Bronze** (1000 K) - Aumenta o número máximo de rolls.\n' +
                '🥈 **Prata** (2000 K) - Reduz o tempo de cooldown dos rolls.\n' +
                '🥇 **Ouro** (3000 K) - Aumenta a chance de tirar personagens da sua wishlist.\n' +
                '🔷 **Safira** (4000 K) - Substitui rolagens repetidas por mais Kakera.\n' +
                '🔴 **Rubi** (5000 K) - Diminui o custo de divórcio (se ativado).\n' +
                '🟢 **Esmeralda** (6000 K) - Permite resetar o timer de claim uma vez por dia.');

        message.reply({ embeds: [embed] });
    }
};
