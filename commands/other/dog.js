const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'dog',
    aliases: ['cachorro', 'auau'],
    async execute(message) {
        try {
            const res = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setColor('#A0522D')
                .setTitle('🐶 Au au!')
                .setImage(data.message);
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Falha ao buscar um cachorro.');
        }
    }
};
