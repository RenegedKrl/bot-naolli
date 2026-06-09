const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'fm',
    aliases: ['favorite', 'favorito'],
    description: 'Define seu personagem favorito para aparecer no seu perfil.',
    async execute(message, args) {
        const charName = args.join(' ').toLowerCase();
        if (!charName) return message.reply('⚠️ Você precisa digitar o nome do personagem. Ex: `n!fm Naruto`');

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

        const userProfileConfig = await getData('userProfile.json') || {};
        if (!userProfileConfig[guildId]) userProfileConfig[guildId] = {};
        
        userProfileConfig[guildId][message.author.id] = { favorite: charId, favoriteName: charData.name, favoriteImage: charData.imageUrl };
        
        await saveData('userProfile.json', userProfileConfig);

        const embed = new EmbedBuilder()
            .setColor('#FF1493')
            .setTitle('⭐ Personagem Favorito Definido!')
            .setDescription(`**${charData.name}** agora é o seu personagem favorito!`)
            .setThumbnail(charData.imageUrl);

        message.reply({ embeds: [embed] });
    }
};
