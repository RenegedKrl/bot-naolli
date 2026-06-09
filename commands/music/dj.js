const { getData, saveData } = require('../../database');

module.exports = {
    name: 'dj',
    aliases: ['setdj', 'playlist'],
    async execute(message, args, client) {
        let config = await getData('djConfig.json');

        const guildId = message.guild.id;

        if (!args.length) {
            // Play the saved playlist
            if (!config[guildId]) return message.reply('⚠️ Nenhuma playlist configurada! O administrador precisa usar `n!dj <link da playlist>` para configurar.');
            
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('❌ Você precisa estar em um canal de voz!');

            message.reply(`🎧 Iniciando a playlist oficial do DJ do servidor!`);
            client.distube.play(voiceChannel, config[guildId], {
                member: message.member,
                textChannel: message.channel,
                message: message.id ? message : undefined
            });
            return;
        }

        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor` para alterar a playlist do DJ!');
        }

        const link = args.join(' ');
        if (!link.includes('http')) return message.reply('⚠️ Por favor, envie um link válido do YouTube ou Spotify!');

        config[guildId] = link;
        await saveData('djConfig.json', config);

        message.reply(`✅ Playlist do DJ configurada com sucesso!\nAgora qualquer pessoa pode digitar \`n!dj\` para tocar essa playlist automaticamente.`);
    }
};
