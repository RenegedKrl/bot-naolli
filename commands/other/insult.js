const { EmbedBuilder } = require('discord.js');
async function translate(text) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(s => s[0]).join('');
}
module.exports = {
    name: 'insult',
    aliases: ['xingar', 'ofender'],
    async execute(message, args) {
        try {
            const target = message.mentions.users.first() || message.author;
            const res = await fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json');
            const data = await res.json();
            const translatedText = await translate(data.insult);
            const embed = new EmbedBuilder().setColor('#FF0000').setDescription(`${target}, ${translatedText}`);
            message.reply({ embeds: [embed] });
        } catch (error) { message.reply('❌ Estou muito zen hoje para xingar alguém.'); }
    }
};
