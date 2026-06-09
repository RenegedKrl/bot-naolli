const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'togglekakera',
    aliases: ['tk'],
    description: '(Admin) Ativa ou desativa a aparição de Kakeras no servidor.',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('⚠️ Apenas administradores podem usar este comando.');
        }

        const serverSettings = await getData('serverSettings.json') || {};
        const guildId = message.guild.id;

        if (!serverSettings[guildId]) serverSettings[guildId] = {};
        
        const currentState = serverSettings[guildId].kakeraEnabled !== false; // Padrão é true
        const newState = !currentState;
        
        serverSettings[guildId].kakeraEnabled = newState;
        await saveData('serverSettings.json', serverSettings);

        const embed = new EmbedBuilder()
            .setColor(newState ? '#00FF00' : '#FF0000')
            .setTitle('⚙️ Configuração de Kakera')
            .setDescription(`A aparição de Kakeras no servidor foi **${newState ? 'ATIVADA' : 'DESATIVADA'}**.`);

        message.reply({ embeds: [embed] });
    }
};
