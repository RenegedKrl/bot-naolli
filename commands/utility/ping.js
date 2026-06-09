const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mostra a latência do bot e da API'),
    async execute(message, args, client) {
        const m = await message.reply('Calculando...');
        const latency = m.createdTimestamp - message.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latência do Bot', value: `\`${latency}ms\``, inline: true },
                { name: 'Latência da API', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true }
            );

        m.edit({ content: null, embeds: [embed] });
    },
    async slashExecute(interaction) {
        const m = await interaction.reply({ content: 'Calculando...', fetchReply: true });
        const latency = m.createdTimestamp - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latência do Bot', value: `\`${latency}ms\``, inline: true },
                { name: 'Latência da API', value: `\`${Math.round(interaction.client.ws.ping)}ms\``, inline: true }
            );

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
