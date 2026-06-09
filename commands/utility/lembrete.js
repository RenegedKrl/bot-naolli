const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'lembrete',
    aliases: ['reminder', 'remind', 'lembre'],
    description: 'Define um lembrete que o bot te enviará no DM.',
    async execute(message, args) {
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'lista') {
            let reminders = await getData('reminders.json') || {};
            const userReminders = reminders[message.author.id] || [];
            if (!userReminders.length) return message.reply('📭 Você não tem lembretes ativos! Use `n!lembrete <tempo> <mensagem>`.\nExemplos: `n!lembrete 10m Assistir anime` | `n!lembrete 2h Dormir`');

            const embed = new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle('⏰ Seus Lembretes')
                .setDescription(userReminders.map((r, i) =>
                    `**${i + 1}.** ${r.msg}\n🕐 <t:${Math.floor(r.time / 1000)}:R>`
                ).join('\n\n'))
                .setFooter({ text: 'Use n!lembrete cancelar <nº> para cancelar.' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'cancelar' || sub === 'cancel') {
            const index = parseInt(args[1]) - 1;
            let reminders = await getData('reminders.json') || {};
            const userReminders = reminders[message.author.id] || [];
            if (isNaN(index) || !userReminders[index]) return message.reply('❌ Lembrete inválido.');
            const removed = userReminders.splice(index, 1)[0];
            reminders[message.author.id] = userReminders;
            await saveData('reminders.json', reminders);
            return message.reply(`✅ Lembrete **"${removed.msg}"** cancelado.`);
        }

        // Parse tempo
        const timeStr = args[0];
        const msgContent = args.slice(1).join(' ');
        if (!msgContent) return message.reply('⚠️ Você esqueceu a mensagem! Use: `n!lembrete 30m Sua mensagem aqui`');

        const match = timeStr.match(/^(\d+)(s|m|h|d)$/i);
        if (!match) return message.reply('⚠️ Formato de tempo inválido! Use: `10s`, `30m`, `2h`, `1d`');

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const delay = value * multipliers[unit];

        if (delay < 10000) return message.reply('❌ O mínimo é 10 segundos!');
        if (delay > 7 * 86400000) return message.reply('❌ O máximo é 7 dias!');

        const fireAt = Date.now() + delay;

        let reminders = await getData('reminders.json') || {};
        if (!reminders[message.author.id]) reminders[message.author.id] = [];
        if (reminders[message.author.id].length >= 5) return message.reply('❌ Você já tem 5 lembretes ativos! Cancele um primeiro.');

        reminders[message.author.id].push({ msg: msgContent, time: fireAt, channelId: message.channel.id, guildId: message.guild.id });
        await saveData('reminders.json', reminders);

        // Agenda o lembrete localmente
        setTimeout(async () => {
            try {
                const user = await message.client.users.fetch(message.author.id);
                const ch = message.client.channels.cache.get(message.channel.id);
                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('⏰ Lembrete!')
                    .setDescription(`Você pediu para ser lembrado:\n**${msgContent}**`);
                (ch || user).send({ content: `${user}`, embeds: [embed] }).catch(() => {});

                // Remove o lembrete após disparar
                let rem = await getData('reminders.json') || {};
                if (rem[message.author.id]) {
                    rem[message.author.id] = rem[message.author.id].filter(r => r.time !== fireAt || r.msg !== msgContent);
                    await saveData('reminders.json', rem);
                }
            } catch (e) {}
        }, delay);

        message.reply(`✅ Lembrete definido! Te aviso **${timeStr}** a partir de agora.\n📝 *"${msgContent}"*`);
    }
};
