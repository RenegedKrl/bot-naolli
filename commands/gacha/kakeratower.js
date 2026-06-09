const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'kakeratower',
    aliases: ['kt', 'tower'],
    description: 'Construa sua torre de Kakera.',
    async execute(message, args) {
        const target = message.author;
        const kakeraConfig = await getData('kakeraConfig.json');
        
        const guildId = message.guild.id;
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        
        let balance = kakeraConfig[guildId][target.id] || 0;
        let towerFloors = kakeraConfig['tower']?.[guildId]?.[target.id] || 0;

        const floorCost = 10000 + (towerFloors * 5000); // Custos: 10k, 15k, 20k...

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'build' || subCommand === 'construir') {
            if (balance < floorCost) {
                return message.reply(`❌ Você não tem Kakeras suficientes para construir o andar **${towerFloors + 1}**! Custa **${floorCost}** K, e você tem **${balance}** K.`);
            }

            balance -= floorCost;
            kakeraConfig[guildId][message.author.id] = balance;
            
            if (!kakeraConfig['tower']) kakeraConfig['tower'] = {};
            if (!kakeraConfig['tower'][guildId]) kakeraConfig['tower'][guildId] = {};
            
            towerFloors++;
            kakeraConfig['tower'][guildId][message.author.id] = towerFloors;
            
            await saveData('kakeraConfig.json', kakeraConfig);
            
            return message.reply(`🏢 **Parabéns!** Você construiu o andar **${towerFloors}** da sua Torre Kakera!`);
        }

        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`🏢 Torre Kakera de ${target.username}`)
            .setDescription(`Você possui **${towerFloors} andares** construídos na sua torre.\n\n` +
                `**Custo do próximo andar:** ${floorCost} Kakeras\n` +
                `**Seu saldo:** ${balance} Kakeras\n\n` +
                `Para construir o próximo andar, digite \`n!kt build\`.`);

        message.reply({ embeds: [embed] });
    }
};
