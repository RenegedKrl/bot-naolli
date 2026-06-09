module.exports = {
    name: 'nickname',
    aliases: ['nick', 'apelido'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageNicknames')) return message.reply('❌ Você não tem permissão para alterar apelidos!');
        const target = message.mentions.members.first();
        if (!target) return message.reply('⚠️ Mencione o usuário!');
        const nick = args.slice(1).join(' ');
        if (!nick) return message.reply('⚠️ Digite o novo apelido!');
        try {
            await target.setNickname(nick);
            message.reply(`✅ Apelido de ${target.user.username} alterado para **${nick}**`);
        } catch (error) {
            message.reply('❌ Não consigo alterar o apelido dessa pessoa (ela tem um cargo maior ou igual ao meu!).');
        }
    }
};
