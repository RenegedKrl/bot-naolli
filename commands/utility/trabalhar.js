const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'trabalhar',
    aliases: ['work', 'trampo'],
    description: 'Trabalhe para ganhar Kakeras (cooldown 1h).',
    async execute(message) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
        if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [], lastWork: 0 };

        const COOLDOWN = 60 * 60 * 1000; // 1 hora
        const lastWork = kakeraConfig[guildId][userId].lastWork || 0;
        const timeLeft = COOLDOWN - (Date.now() - lastWork);

        if (timeLeft > 0) {
            const min = Math.floor(timeLeft / 60000);
            const sec = Math.floor((timeLeft % 60000) / 1000);
            return message.reply(`⏳ Você ainda está cansado! Descanse por **${min}m ${sec}s** antes de trabalhar de novo.`);
        }

        const jobs = [
            { title: 'Programador', desc: 'Você passou horas debugando código e seu cliente ficou feliz!', min: 80, max: 200 },
            { title: 'Chef de Cozinha', desc: 'Você preparou um banquete incrível no restaurante!', min: 60, max: 150 },
            { title: 'Streamer', desc: 'Você fez uma live épica e as doações choveram!', min: 50, max: 300 },
            { title: 'Guarda de Segurança', desc: 'Você ficou de plantão a noite toda sem incidentes.', min: 40, max: 100 },
            { title: 'Entregador de Pizza', desc: 'Você entregou 50 pizzas hoje com gorjeta generosa!', min: 50, max: 120 },
            { title: 'Artista', desc: 'Você vendeu uma pintura por uma fortuna!', min: 30, max: 500 },
            { title: 'Professor', desc: 'Você ensinou 30 alunos e um deles foi gênio!', min: 60, max: 140 },
            { title: 'Hacker Ético', desc: 'Você encontrou uma vulnerabilidade e recebeu o bug bounty!', min: 100, max: 400 },
            { title: 'Ninja', desc: 'Missão secreta concluída. Detalhes classificados.', min: 200, max: 500 },
        ];

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        // Bonus se tem pet feliz
        let petBonus = 0;
        let bonusText = '';
        const petData = await getData('petData.json') || {};
        const pet = petData[guildId]?.[userId];
        if (pet && pet.happiness >= 80) {
            petBonus = Math.floor(earned * 0.10);
            bonusText = `\n🐾 **Bônus do Pet Feliz:** +${petBonus} K`;
        }

        const totalEarned = earned + petBonus;
        kakeraConfig[guildId][userId].balance += totalEarned;
        kakeraConfig[guildId][userId].lastWork = Date.now();
        await saveData('kakeraConfig.json', kakeraConfig);

        const embed = new EmbedBuilder()
            .setColor('#32CD32')
            .setTitle(`💼 ${job.title}`)
            .setDescription(`${job.desc}${bonusText}`)
            .addFields(
                { name: '💎 Salário Recebido', value: `**${totalEarned} Kakeras**`, inline: true },
                { name: '💰 Saldo Total', value: `${kakeraConfig[guildId][userId].balance} Kakeras`, inline: true }
            )
            .setFooter({ text: 'Próximo trabalho disponível em 1 hora.' });

        message.reply({ embeds: [embed] });
    }
};
