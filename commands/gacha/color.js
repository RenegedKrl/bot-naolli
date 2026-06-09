const { getData, saveData } = require('../../database');

module.exports = {
    name: 'color',
    aliases: ['cor'],
    description: 'Muda a cor do painel de um personagem que você possui (Custa 500 Kakera).',
    async execute(message, args) {
        if (args.length < 2) return message.reply('⚠️ Formato incorreto. Use: `n!color <código HEX> <nome do personagem>`\nExemplo: `n!color #FF0000 Naruto`');

        const hexColor = args[0];
        const charNameQuery = args.slice(1).join(' ').toLowerCase();

        if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
            return message.reply('❌ A cor deve ser um código HEX válido! (Ex: `#FF0000` para vermelho)');
        }

        let config = await getData('gachaConfig.json');
        let kakeraConfig = await getData('kakeraConfig.json');
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!config[guildId]) return message.reply('⚠️ O banco de dados do servidor está vazio.');
        
        let foundId = null;
        let foundChar = null;

        for (const [id, char] of Object.entries(config[guildId])) {
            if (char.ownerId === userId && char.name.toLowerCase().includes(charNameQuery)) {
                foundId = id;
                foundChar = char;
                break;
            }
        }

        if (!foundId) return message.reply(`❌ Você não é dono(a) de nenhum personagem chamado **"${charNameQuery}"**.`);

        // Cobrar 500 Kakera
        if (!kakeraConfig[guildId] || !kakeraConfig[guildId][userId] || kakeraConfig[guildId][userId].balance < 500) {
            return message.reply(`❌ Você não tem Kakera suficiente! Custa **500 Kakeras** para mudar a cor de um personagem.`);
        }

        kakeraConfig[guildId][userId].balance -= 500;
        await saveData('kakeraConfig.json', kakeraConfig);

        config[guildId][foundId].color = hexColor;
        await saveData('gachaConfig.json', config);

        message.reply(`🎨 Cor de **${foundChar.name}** alterada para \`${hexColor}\` com sucesso! (Gastou 500 Kakeras)`);
    }
};
