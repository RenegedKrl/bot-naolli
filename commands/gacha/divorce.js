const { getData, saveData } = require('../../database');

module.exports = {
    name: 'divorce',
    aliases: ['release', 'divorciar'],
    async execute(message, args) {
        let config = await getData('gachaConfig.json');
        const guildId = message.guild.id;
        
        if (!config[guildId]) return message.reply('⚠️ O banco de dados do servidor está vazio.');

        const charNameQuery = args.join(' ').toLowerCase();
        if (!charNameQuery) return message.reply('⚠️ Digite o nome do personagem! (Ex: `n!divorce Naruto`)');

        let foundId = null;
        let foundChar = null;

        for (const [id, char] of Object.entries(config[guildId])) {
            if (char.ownerId === message.author.id && char.name.toLowerCase().includes(charNameQuery)) {
                foundId = id;
                foundChar = char;
                break;
            }
        }

        if (!foundId) {
            return message.reply(`❌ Você não é dono(a) de nenhum personagem que contenha o nome **"${args.join(' ')}"**.`);
        }

        delete config[guildId][foundId];
        await saveData('gachaConfig.json', config);

        message.reply(`💔 Você se divorciou de **${foundChar.name}**. O personagem agora está livre de novo no servidor!`);
    }
};
