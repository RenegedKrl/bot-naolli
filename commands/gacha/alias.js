const { getData, saveData } = require('../../database');

module.exports = {
    name: 'alias',
    aliases: ['apelido'],
    description: 'Adiciona um apelido a um personagem seu para facilitar a busca.',
    async execute(message, args) {
        if (args.length < 2) return message.reply('⚠️ Use: `n!alias <novo_apelido> | <nome_original_do_personagem>`\nEx: `n!alias Zezinho | Naruto Uzumaki`');

        const parts = args.join(' ').split('|');
        if (parts.length !== 2) return message.reply('❌ Você esqueceu de colocar o `|` para separar o apelido do nome original!');

        const alias = parts[0].trim().toLowerCase();
        const originalName = parts[1].trim().toLowerCase();

        let config = await getData('gachaConfig.json');
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!config[guildId]) return message.reply('⚠️ O banco de dados do servidor está vazio.');

        let foundId = null;
        let foundChar = null;

        for (const [id, char] of Object.entries(config[guildId])) {
            if (char.ownerId === userId && char.name.toLowerCase().includes(originalName)) {
                foundId = id;
                foundChar = char;
                break;
            }
        }

        if (!foundId) return message.reply(`❌ Você não possui nenhum personagem com o nome **"${originalName}"**.`);

        if (!config[guildId][foundId].aliases) {
            config[guildId][foundId].aliases = [];
        }

        if (config[guildId][foundId].aliases.includes(alias)) {
            return message.reply('⚠️ Esse personagem já possui esse apelido!');
        }

        config[guildId][foundId].aliases.push(alias);
        await saveData('gachaConfig.json', config);

        message.reply(`🏷️ O apelido **"${alias}"** foi adicionado a **${foundChar.name}** com sucesso!`);
    }
};
