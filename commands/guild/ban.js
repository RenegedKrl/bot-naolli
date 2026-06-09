module.exports = {
    name: 'ban',
    aliases: ['banir'],
    async execute(message, args) {
        if (!message.member.permissions.has('BanMembers')) {
            return message.reply('❌ Você não tem permissão para banir!');
        }
        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Você precisa mencionar quem deseja banir!');
        
        try {
            await user.ban({ reason: args.slice(1).join(' ') || 'Nenhuma razão fornecida.' });
            message.reply(`🔨 \`${user.user.tag}\` foi banido com sucesso!`);
        } catch (error) {
            message.reply('❌ Não consegui banir este usuário. Meu cargo está abaixo do dele ou ele é o dono do servidor!');
        }
    }
};
