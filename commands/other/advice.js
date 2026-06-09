const { EmbedBuilder } = require('discord.js');

async function translate(text) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(s => s[0]).join('');
}

module.exports = {
    name: 'advice',
    aliases: ['conselho'],
    async execute(message) {
        try {
            const res = await fetch('https://api.adviceslip.com/advice');
            const data = await res.json();
            
            const translatedText = await translate(data.slip.advice);

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('💡 Conselho do dia')
                .setDescription(`*${translatedText}*`);
                
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Fiquei sem conselhos hoje.');
        }
    }
};
