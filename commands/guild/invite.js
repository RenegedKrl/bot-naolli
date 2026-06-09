const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'invite',
    aliases: ['convite'],
    async execute(message, args, client) {
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('✉️ Me convide para o seu servidor!')
            .setDescription(`[Clique aqui para me adicionar!](${inviteLink})`);
        message.reply({ embeds: [embed] });
    }
};
