const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'jojo',
    async execute(message) {
        try {
            const apiKey = 'LIVDSRZULELA';
            const res = await fetch(`https://g.tenor.com/v1/search?key=${apiKey}&q=jojo+bizarre+adventure&limit=20`);
            const data = await res.json();
            const gif = data.results[Math.floor(Math.random() * data.results.length)].media[0].gif.url;
            const embed = new EmbedBuilder().setColor('#9B59B6').setImage(gif);
            message.reply({ embeds: [embed] });
        } catch (error) { message.reply('❌ Erro ao buscar GIF.'); }
    }
};
