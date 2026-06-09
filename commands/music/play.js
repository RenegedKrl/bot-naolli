const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'play',
    aliases: ['p', 'tocar'],
    async execute(message, args, client) {
        if (!args.length) return message.reply('❌ Você precisa me dizer o que tocar! (ex: `n!play lo-fi beats`)');
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Você precisa estar em um canal de voz para tocar música!');

        // Checar permissões (Opcional, mas boa prática)
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.reply('❌ Eu não tenho permissão para entrar e falar nesse canal de voz!');
        }

        try {
            message.channel.send('🔍 Buscando sua música...');
            await client.distube.play(voiceChannel, args.join(' '), {
                message: message.id ? message : undefined,
                textChannel: message.channel,
                member: message.member,
            });
        } catch (error) {
            console.error(error);
            message.reply('❌ Ocorreu um erro ao tentar tocar a música.');
        }
    }
};
