const { EmbedBuilder } = require('discord.js');
async function translate(text) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(s => s[0]).join('');
}
module.exports = {
    name: 'bored',
    aliases: ['tedio'],
    async execute(message) {
        try {
            const res = await fetch('https://www.boredapi.com/api/activity');
            const data = await res.json();
            const translatedText = await translate(data.activity);
            const embed = new EmbedBuilder().setColor('#FFD700').setTitle('🥱 Tá no tédio? Tente fazer isso:').setDescription(`*${translatedText}*`);
            message.reply({ embeds: [embed] });
        } catch (error) { message.reply('❌ Não consegui achar nada pra você fazer. Vai dormir!'); }
    }
};
