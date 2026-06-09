module.exports = {
    name: 'volume',
    aliases: ['v', 'vol'],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message);
        if (!queue) return message.reply('❌ Não há nada tocando!');
        const vol = parseInt(args[0]);
        if (isNaN(vol) || vol < 0 || vol > 200) return message.reply('⚠️ Digite um volume válido entre `0` e `200`!');

        client.distube.setVolume(message, vol);
        message.reply(`🔊 Volume alterado para \`${vol}%\`!`);
    }
};
