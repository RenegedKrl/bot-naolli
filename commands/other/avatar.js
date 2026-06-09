const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'avatar',
    aliases: ['foto', 'icon'],
    async execute(message) {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`📸 Avatar de ${user.username}`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));
        message.reply({ embeds: [embed] });
    }
};
