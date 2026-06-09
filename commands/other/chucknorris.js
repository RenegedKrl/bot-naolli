const { EmbedBuilder } = require('discord.js');

async function translate(text) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(s => s[0]).join('');
}

module.exports = {
    name: 'chucknorris',
    aliases: ['chuck', 'piada'],
    async execute(message) {
        try {
            const res = await fetch('https://api.chucknorris.io/jokes/random');
            const data = await res.json();
            
            const translatedText = await translate(data.value);

            const embed = new EmbedBuilder()
                .setColor('#F5DEB3')
                .setTitle('🤠 Fato sobre Chuck Norris')
                .setThumbnail(data.icon_url)
                .setDescription(`*${translatedText}*`);
                
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Erro ao buscar o fato. Chuck Norris deve ter quebrado a API.');
        }
    }
};
