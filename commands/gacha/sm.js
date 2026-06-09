const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'sm',
    aliases: ['sort'],
    description: 'Organiza sua coleção de personagens.',
    async execute(message, args) {
        const config = await getData('gachaConfig.json');
        const guildId = message.guild.id;

        if (!config[guildId]) return message.reply('⚠️ Ninguém no servidor tem personagens ainda!');

        // Get all characters owned by user
        let userChars = Object.entries(config[guildId]).filter(([id, char]) => char.ownerId === message.author.id);

        if (userChars.length === 0) {
            return message.reply(`❌ Você não possui personagens na coleção para organizar.`);
        }

        const sortType = args[0]?.toLowerCase();

        if (sortType === 'name' || sortType === 'nome' || sortType === 'a') {
            userChars.sort((a, b) => a[1].name.localeCompare(b[1].name));
        } else if (sortType === 'anime' || sortType === 'serie') {
            userChars.sort((a, b) => a[1].anime.localeCompare(b[1].anime));
        } else {
            return message.reply('⚠️ Por favor, especifique o tipo de organização. Ex: `n!sm nome` ou `n!sm anime`.');
        }

        // We need a way to store the user's custom sort order if we want it to apply to n!harem.
        // For simplicity, we can just display the sorted list right now.
        // To do this properly, we could recreate the user's entries in gachaConfig but JS objects are not strictly ordered.
        // Or we could store an array of IDs in a userSort.json
        
        let userSortConfig = await getData('userSort.json') || {};
        if (!userSortConfig[guildId]) userSortConfig[guildId] = {};
        
        // Save the sorted order as an array of character IDs
        userSortConfig[guildId][message.author.id] = userChars.map(entry => entry[0]);
        await saveData('userSort.json', userSortConfig);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Coleção Organizada!')
            .setDescription(`Sua coleção foi organizada com sucesso por **${sortType}**!\n\n*(Nota: O comando \`n!harem\` precisará ser atualizado para ler esta ordem personalizada em breve)*`);

        message.reply({ embeds: [embed] });
    }
};
