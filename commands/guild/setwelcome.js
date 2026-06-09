const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'setwelcome',
    aliases: ['welcome-message', 'boasvindas-config'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor` para configurar as boas-vindas!');
        }

        if (!args.length) {
            return message.reply(
                '⚠️ **Como configurar as Boas-Vindas:**\n\n' +
                '`n!setwelcome channel #canal` - Define o canal\n' +
                '`n!setwelcome text <texto>` - Define a mensagem (Use `{user}` para mencionar e `{server}` para o nome do servidor)\n' +
                '`n!setwelcome button <url> <texto>` - Adiciona um botão com link (ex: `n!setwelcome button https://google.com Meu Site`)'
            );
        }

        let config = await getData('welcomeConfig.json');

        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = {};
        
        if (typeof config[guildId] === 'string') {
            config[guildId] = { channelId: config[guildId] };
        }

        const action = args[0].toLowerCase();

        if (action === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal válido!');
            config[guildId].channelId = channel.id;
            message.reply(`✅ Canal de boas-vindas definido para ${channel}!`);
        } else if (action === 'text') {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('⚠️ Digite o texto das boas vindas!');
            config[guildId].text = text;
            message.reply(`✅ Texto de boas-vindas atualizado!\n*(Prévia: ${text.replace(/{user}/g, message.author.toString()).replace(/{server}/g, message.guild.name)})*`);
        } else if (action === 'button') {
            const url = args[1];
            const label = args.slice(2).join(' ');
            if (!url || !url.startsWith('http') || !label) {
                return message.reply('⚠️ Formato incorreto! Use: `n!setwelcome button https://seusite.com Meu Site`');
            }
            config[guildId].buttonUrl = url;
            config[guildId].buttonLabel = label;
            message.reply(`✅ Botão **[${label}]** configurado com sucesso para o link: ${url}`);
        } else {
            return message.reply('⚠️ Ação inválida. Use `channel`, `text` ou `button`.');
        }

        await saveData('welcomeConfig.json', config);
    }
};
