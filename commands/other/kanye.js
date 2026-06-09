const { EmbedBuilder } = require('discord.js');
async function translate(text) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(s => s[0]).join('');
}
module.exports = {
    name: 'kanye',
    async execute(message) {
        try {
            const res = await fetch('https://api.kanye.rest/');
            const data = await res.json();
            const translatedText = await translate(data.quote);
            const embed = new EmbedBuilder().setColor('#8B4513').setTitle('🎤 Frase do Kanye West').setDescription(`*"${translatedText}"*`);
            message.reply({ embeds: [embed] });
        } catch (error) { message.reply('❌ Kanye não quer falar hoje.'); }
    }
};
