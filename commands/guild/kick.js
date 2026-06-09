module.exports = {
    name: 'kick',
    aliases: ['expulsar'],
    async execute(message, args) {
        if (!message.member.permissions.has('KickMembers')) {
            return message.reply('❌ Você não tem permissão para expulsar!');
        }
        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Você precisa mencionar quem deseja expulsar!');
        
        try {
            await user.kick(args.slice(1).join(' ') || 'Nenhuma razão fornecida.');
            message.reply(`👢 \`${user.user.tag}\` foi expulso com sucesso!`);
        } catch (error) {
            message.reply('❌ Não consegui expulsar este usuário. Meu cargo está abaixo do dele ou ele é o dono do servidor!');
        }
    }
};
