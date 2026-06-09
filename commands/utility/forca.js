const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const WORD_CATEGORIES = {
    frutas: ['melancia', 'morango', 'laranja', 'abacaxi', 'banana', 'uva', 'mango', 'pera', 'maçã'],
    animais: ['elefante', 'girafa', 'tigre', 'leao', 'pinguim', 'golfinho', 'cobra', 'aguia', 'lobo'],
    paises: ['brasil', 'japao', 'franca', 'canada', 'australia', 'mexico', 'egito', 'india', 'russia'],
    animes: ['naruto', 'bleach', 'gintama', 'rezero', 'berserk', 'vinland', 'chainsaw', 'pluto'],
};

module.exports = {
    name: 'forca',
    aliases: ['hangman', 'palavraoculta'],
    description: 'Jogo da Forca em grupo! Adivinhem a palavra e ganhem Kakeras.',
    async execute(message, args) {
        const categoria = args[0]?.toLowerCase() || 'animes';
        if (!WORD_CATEGORIES[categoria]) {
            return message.reply(`⚠️ Categorias disponíveis: \`${Object.keys(WORD_CATEGORIES).join('`, `')}\`\nUse: \`n!forca <categoria>\``);
        }

        const words = WORD_CATEGORIES[categoria];
        const secret = words[Math.floor(Math.random() * words.length)];
        const guessed = new Set();
        const maxErrors = 6;
        let errors = 0;

        const HANGMAN = [
            '```\n  _____\n |     |\n |\n |\n |\n_|_\n```',
            '```\n  _____\n |     |\n |     O\n |\n |\n_|_\n```',
            '```\n  _____\n |     |\n |     O\n |     |\n |\n_|_\n```',
            '```\n  _____\n |     |\n |     O\n |    /|\n |\n_|_\n```',
            '```\n  _____\n |     |\n |     O\n |    /|\\\n |\n_|_\n```',
            '```\n  _____\n |     |\n |     O\n |    /|\\\n |    /\n_|_\n```',
            '```\n  _____\n |     |\n |     O\n |    /|\\\n |    / \\\n_|_\n```',
        ];

        const getDisplay = () => secret.split('').map(l => guessed.has(l) ? l.toUpperCase() : '_').join(' ');
        const getWrongLetters = () => [...guessed].filter(l => !secret.includes(l)).join(', ') || 'Nenhuma';

        const buildEmbed = (status = '') => new EmbedBuilder()
            .setColor(errors >= maxErrors ? '#FF0000' : errors > 3 ? '#FFA500' : '#00FF00')
            .setTitle(`🎭 Jogo da Forca — ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`)
            .setDescription(`${HANGMAN[errors]}\n**Palavra:** \`${getDisplay()}\``)
            .addFields(
                { name: '❌ Erros', value: `${errors}/${maxErrors}`, inline: true },
                { name: '🔤 Letras Erradas', value: getWrongLetters() || 'Nenhuma', inline: true }
            )
            .setDescription(`${HANGMAN[errors]}\n**Palavra:** \`${getDisplay()}\`\n\n${status}`)
            .setFooter({ text: 'Digite uma letra no chat para jogar!' });

        const gameMsg = await message.channel.send({ embeds: [buildEmbed()] });

        const filter = m => !m.author.bot && m.content.length === 1 && /[a-záéíóúãõç]/i.test(m.content);
        const collector = message.channel.createMessageCollector({ filter, time: 120000 });

        collector.on('collect', async m => {
            const letter = m.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            m.delete().catch(() => {});

            if (guessed.has(letter)) {
                const warn = await m.channel.send(`⚠️ **${m.author.username}**, a letra \`${letter}\` já foi usada!`);
                setTimeout(() => warn.delete().catch(() => {}), 2000);
                return;
            }

            guessed.add(letter);
            if (!secret.includes(letter)) errors++;

            const display = getDisplay();
            const won = !display.includes('_');

            if (won || errors >= maxErrors) {
                collector.stop(won ? 'win' : 'lose');
            } else {
                await gameMsg.edit({ embeds: [buildEmbed(`${m.author} chutou \`${letter}\``)] });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'win') {
                const winners = [...new Set([...collected.values()].filter(m => secret.includes(m.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).map(m => m.author.id))];
                const reward = 200;

                let kakeraConfig = await getData('kakeraConfig.json') || {};
                for (const uid of winners) {
                    if (!kakeraConfig[message.guild.id]) kakeraConfig[message.guild.id] = {};
                    if (!kakeraConfig[message.guild.id][uid]) kakeraConfig[message.guild.id][uid] = { balance: 0, badges: [] };
                    kakeraConfig[message.guild.id][uid].balance += reward;
                }
                if (winners.length) await saveData('kakeraConfig.json', kakeraConfig);

                gameMsg.edit({ embeds: [buildEmbed(`🎉 **Palavra descoberta!** Era: \`${secret.toUpperCase()}\`\n💎 Quem acertou letras ganhou +${reward} Kakeras!`)] });
            } else {
                gameMsg.edit({ embeds: [buildEmbed(`☠️ **Game Over!** A palavra era: \`${secret.toUpperCase()}\``)] });
            }
        });
    }
};
