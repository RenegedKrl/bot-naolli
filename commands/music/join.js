module.exports = {
    name: 'join',
    aliases: ['entrar'],
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Você precisa estar em um canal de voz!');
        client.distube.voices.join(voiceChannel);
        message.reply('✅ Entrei no canal de voz!');
    }
};
