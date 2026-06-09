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

        const rarityValues = {
            '🟡 Lendária': 500,
            '🟣 Épica': 250,
            '🔵 Rara': 100,
            '🟢 Incomum': 50,
            '⚪ Comum': 10
        };

        const refundAmount = foundChar.value || rarityValues[foundChar.rarity] || 10;

        delete config[guildId][foundId];
        await saveData('gachaConfig.json', config);

        let kakeraConfig = await getData('kakeraConfig.json');
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig[guildId][message.author.id]) kakeraConfig[guildId][message.author.id] = { balance: 0, badges: [] };

        kakeraConfig[guildId][message.author.id].balance += refundAmount;
        await saveData('kakeraConfig.json', kakeraConfig);

        message.reply(`💔 Você se divorciou de **${foundChar.name}**.\n💎 Você recebeu **${refundAmount} Kakeras** de volta pelo valor do personagem.`);
    }
};
