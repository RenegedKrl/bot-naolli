const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'meme',
    aliases: ['memes'],
    async execute(message) {
        try {
            const subs = ['eu_nvr', 'DiretoDoZapZap', 'ShitpostBR', 'botecodoreddit'];
            const sub = subs[Math.floor(Math.random() * subs.length)];
            const res = await fetch(`https://meme-api.com/gimme/${sub}`);
            const data = await res.json();
            
            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle(data.title)
                .setURL(data.postLink)
                .setImage(data.url)
                .setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });
                
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Erro ao buscar um meme.');
        }
    }
};
