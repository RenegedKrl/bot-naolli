const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'poll',
    aliases: ['votacao', 'enquete'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Você não tem permissão para criar votações!');
        }
        if (!args.length) return message.reply('⚠️ Faça uma pergunta para a votação! (ex: `n!poll Vamos jogar hoje?`)');

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📊 Nova Votação!')
            .setDescription(`**${args.join(' ')}**`)
            .setFooter({ text: `Votação criada por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

        const sentMessage = await message.channel.send({ embeds: [embed] });
        message.delete().catch(() => null);
        
        await sentMessage.react('👍');
        await sentMessage.react('👎');
    }
};
