module.exports = {
    name: 'leave',
    aliases: ['sair', 'disconnect'],
    async execute(message, args, client) {
        client.distube.voices.leave(message);
        message.reply('👋 Saí do canal de voz!');
    }
};
