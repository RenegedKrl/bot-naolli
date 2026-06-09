const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'gif',
    aliases: ['searchgif'],
    async execute(message, args) {
        if (!args.length) return message.reply('⚠️ Digite o que deseja buscar! (ex: `n!gif gato engraçado`)');
        try {
            const apiKey = 'LIVDSRZULELA'; // Tenor Public Key
            const res = await fetch(`https://g.tenor.com/v1/search?key=${apiKey}&q=${encodeURIComponent(args.join(' '))}&limit=1`);
            const data = await res.json();
            
            if (!data.results || !data.results.length) return message.reply('❌ Nenhum GIF encontrado!');
            
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(`Pesquisa: ${args.join(' ')}`)
                .setImage(data.results[0].media[0].gif.url);
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Erro ao buscar o GIF.');
        }
    }
};
