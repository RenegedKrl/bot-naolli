module.exports = {
    name: 'say',
    aliases: ['falar'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Você não tem permissão para usar isso!');
        }
        if (!args.length) return message.reply('⚠️ Você precisa me dizer o que falar!');
        
        message.delete().catch(() => null);
        message.channel.send(args.join(' '));
    }
};
