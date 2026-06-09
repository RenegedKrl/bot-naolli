module.exports = {
    name: 'prune',
    aliases: ['limpar', 'clear'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Você não tem permissão para limpar mensagens!');
        }
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 99) {
            return message.reply('⚠️ Digite um número de `1` a `99` para limpar.');
        }

        await message.channel.bulkDelete(amount + 1, true).catch(err => {
            message.channel.send('❌ Ocorreu um erro ao limpar as mensagens. (Mensagens com mais de 14 dias não podem ser apagadas).');
        });
        message.channel.send(`🧹 \`${amount}\` mensagens foram apagadas a pedido de ${message.author}!`).then(m => setTimeout(() => m.delete().catch(()=>null), 5000));
    }
};
