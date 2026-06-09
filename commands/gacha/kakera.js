const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'kakera',
    aliases: ['k', 'kakeras'],
    description: 'Mostra a sua quantidade de Kakera.',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const kakeraConfig = await getData('kakeraConfig.json');
        
        const guildId = message.guild.id;
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        
        let balance = kakeraConfig[guildId][target.id] || 0;
        let badges = kakeraConfig['badges']?.[guildId]?.[target.id] || [];

        const badgePrices = {
            bronze: 1000,
            prata: 2000,
            ouro: 3000,
            safira: 4000,
            rubi: 5000,
            esmeralda: 6000
        };

        const badgeEmojis = {
            bronze: '🥉',
            prata: '🥈',
            ouro: '🥇',
            safira: '🔷',
            rubi: '🔴',
            esmeralda: '🟢'
        };

        const badgeArg = args[0]?.toLowerCase();

        if (badgeArg && target.id === message.author.id) {
            // Tentativa de compra
            if (!badgePrices[badgeArg]) {
                return message.reply('⚠️ Insígnia inválida. Use `n!kr` para ver as opções.');
            }
            if (badges.includes(badgeArg)) {
                return message.reply(`❌ Você já possui a insígnia de **${badgeArg}**!`);
            }
            if (balance < badgePrices[badgeArg]) {
                return message.reply(`❌ Você não tem Kakeras suficientes! Custa **${badgePrices[badgeArg]}** K, e você tem **${balance}** K.`);
            }

            // Comprar
            balance -= badgePrices[badgeArg];
            kakeraConfig[guildId][message.author.id] = balance;
            
            if (!kakeraConfig['badges']) kakeraConfig['badges'] = {};
            if (!kakeraConfig['badges'][guildId]) kakeraConfig['badges'][guildId] = {};
            if (!kakeraConfig['badges'][guildId][message.author.id]) kakeraConfig['badges'][guildId][message.author.id] = [];
            
            kakeraConfig['badges'][guildId][message.author.id].push(badgeArg);
            badges = kakeraConfig['badges'][guildId][message.author.id];
            
            await saveData('kakeraConfig.json', kakeraConfig);
            
            message.channel.send(`🎉 **${message.author.username}** comprou a insígnia ${badgeEmojis[badgeArg]} **${badgeArg.toUpperCase()}**!`);
        }

        const badgeDisplay = badges.length > 0 ? badges.map(b => badgeEmojis[b]).join(' ') : 'Nenhuma insígnia';

        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`💎 Perfil Kakera de ${target.username}`)
            .setDescription(`**Saldo:** ${balance} Kakeras\n\n**Insígnias:** ${badgeDisplay}`)
            .setFooter({ text: 'Use n!kr para ver as recompensas' });

        message.reply({ embeds: [embed] });
    }
};
