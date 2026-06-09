const { EmbedBuilder } = require('discord.js');
const { getData } = require('../../database');

module.exports = {
    name: 'rpgperfil',
    aliases: ['rpg', 'status', 'stats'],
    description: 'Mostra o seu perfil de aventureiro RPG.',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const guildId = message.guild.id;
        const userId = target.id;

        let rpg = await getData('rpgData.json') || {};
        const data = rpg[guildId]?.[userId];

        if (!data) {
            return message.reply(`${target === message.author ? 'Você' : target.username} ainda não é um aventureiro! Use \`n!batalha\` para começar.`);
        }

        const hpBar = '█'.repeat(Math.floor((data.maxHp > 0 ? data.maxHp / data.maxHp : 0) * 10)) + '░'.repeat(10 - Math.floor((data.maxHp > 0 ? data.maxHp / data.maxHp : 0) * 10));
        const xpBar = '█'.repeat(Math.floor((data.xp / data.xpNeeded) * 10)) + '░'.repeat(10 - Math.floor((data.xp / data.xpNeeded) * 10));

        const titles = ['Novato', 'Aprendiz', 'Guerreiro', 'Veterano', 'Elite', 'Mestre', 'Grande Mestre', 'Herói', 'Lenda', 'Deus'];
        const title = titles[Math.min(Math.floor(data.level / 5), titles.length - 1)];

        const embed = new EmbedBuilder()
            .setColor('#C0A050')
            .setTitle(`⚔️ ${target.username} — ${title}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 Nível RPG', value: `**${data.level}**`, inline: true },
                { name: '❤️ HP Máximo', value: `**${data.maxHp}**`, inline: true },
                { name: '⚔️ ATK', value: `**${data.atk}**`, inline: true },
                { name: '🛡️ DEF', value: `**${data.def}**`, inline: true },
                { name: '✨ XP de Batalha', value: `\`${xpBar}\` ${data.xp}/${data.xpNeeded}`, inline: false }
            )
            .setFooter({ text: 'Use n!batalha para lutar contra monstros!' });

        message.reply({ embeds: [embed] });
    }
};
