const { getData, saveData } = require('../../database');

module.exports = {
    name: 'note',
    aliases: ['nota'],
    description: 'Adiciona uma nota customizada ao rodapé de um personagem seu (Custa 200 Kakera).',
    async execute(message, args) {
        if (args.length < 2) return message.reply('⚠️ Formato incorreto. Use: `n!note <nome_do_personagem> | <nota_customizada>`\nEx: `n!note Naruto | Meu ninja favorito!`');

        const parts = args.join(' ').split('|');
        if (parts.length !== 2) return message.reply('❌ Você esqueceu de colocar o `|` para separar o nome do personagem da nota!');

        const charNameQuery = parts[0].trim().toLowerCase();
        const customNote = parts[1].trim();

        if (customNote.length > 100) return message.reply('❌ A nota é muito longa! O máximo é 100 caracteres.');

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

        if (!foundId) return message.reply(`❌ Você não é dono(a) de nenhum personagem com o nome **"${charNameQuery}"**.`);

        // Cobrar 200 Kakera
        if (!kakeraConfig[guildId] || !kakeraConfig[guildId][userId] || kakeraConfig[guildId][userId].balance < 200) {
            return message.reply(`❌ Você não tem Kakera suficiente! Custa **200 Kakeras** para adicionar uma nota.`);
        }

        kakeraConfig[guildId][userId].balance -= 200;
        await saveData('kakeraConfig.json', kakeraConfig);

        config[guildId][foundId].note = customNote;
        await saveData('gachaConfig.json', config);

        message.reply(`📝 Nota adicionada a **${foundChar.name}** com sucesso! (Gastou 200 Kakeras)`);
    }
};
