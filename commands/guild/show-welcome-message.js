const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'show-welcome-message',
    aliases: ['testwelcome', 'boasvindas'],
    async execute(message) {
        const allConfig = await getData('welcomeConfig.json');
        const config = allConfig[message.guild.id] || {};

        let desc = config.text || `Estamos muito felizes em ter você aqui no **{server}**!\n\nLeia as regras, interaja no chat e ouça umas músicas comigo!`;
        desc = desc.replace(/{user}/g, message.author.toString()).replace(/{server}/g, message.guild.name);

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`🎉 Bem-vindo(a) ao servidor, ${message.author.username}!`)
            .setDescription(desc)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
            .setImage('https://media.tenor.com/2s_T4p-yR5cAAAAC/anime-welcome.gif')
            .setFooter({ text: `Agora somos ${message.guild.memberCount} membros!` });

        const components = [];
        if (config.buttonUrl && config.buttonLabel) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(config.buttonLabel)
                    .setURL(config.buttonUrl)
                    .setStyle(ButtonStyle.Link)
            );
            components.push(row);
        }

        message.channel.send({ 
            content: `Olá ${message.author}, este é um **teste** de como ficam as boas-vindas:`, 
            embeds: [embed], 
            components: components.length ? components : undefined 
        });
    }
};
