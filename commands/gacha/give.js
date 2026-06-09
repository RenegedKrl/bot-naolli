const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'give',
    aliases: ['dar'],
    description: 'Dá um personagem seu para outro usuário.',
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) return message.reply('⚠️ Você precisa mencionar o usuário para quem deseja dar o personagem. Ex: `n!give @usuario Nome do Personagem`');
        
        if (target.id === message.author.id) return message.reply('⚠️ Você não pode dar um personagem para si mesmo.');

        const charName = args.slice(1).join(' ').toLowerCase();
        if (!charName) return message.reply('⚠️ Você precisa digitar o nome do personagem. Ex: `n!give @usuario Naruto`');

        const config = await getData('gachaConfig.json');
        const guildId = message.guild.id;

        if (!config[guildId]) return message.reply('⚠️ Ninguém no servidor tem personagens ainda!');

        const userChars = Object.entries(config[guildId]).filter(([id, char]) => char.ownerId === message.author.id && char.name.toLowerCase().includes(charName));

        if (userChars.length === 0) {
            return message.reply(`❌ Você não possui nenhum personagem com o nome **${charName}**.`);
        }

        if (userChars.length > 1) {
            return message.reply(`⚠️ Encontrei múltiplos personagens com esse nome. Por favor, seja mais específico.`);
        }

        const [charId, charData] = userChars[0];

        config[guildId][charId].ownerId = target.id;
        await saveData('gachaConfig.json', config);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎁 Personagem Presenteado!')
            .setDescription(`**${message.author.username}** deu **${charData.name}** para **${target.username}**!`);

        message.reply({ embeds: [embed] });
    }
};
