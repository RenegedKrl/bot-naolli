const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

async function fetchRandomCharacter() {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const query = `query {
        Page(page: ${randomPage}, perPage: 50) {
            characters(sort: FAVOURITES_DESC) {
                name { full }
                image { large }
            }
        }
    }`;

    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const res = await fetchFn('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    const json = await res.json();
    if (json.errors) return null;
    
    const chars = json.data.Page.characters.filter(c => c.image && c.image.large);
    return chars[Math.floor(Math.random() * chars.length)];
}

module.exports = {
    name: 'quiz',
    aliases: ['animequiz', 'advinhar'],
    description: 'Minigame: Adivinhe o nome do personagem para ganhar Kakeras!',
    async execute(message) {
        const msg = await message.reply('🎲 Buscando um personagem para o Quiz...');

        const character = await fetchRandomCharacter();
        if (!character) {
            return msg.edit('❌ Erro ao buscar o personagem. Tente novamente.');
        }

        const charName = character.name.full.toLowerCase();

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🧠 Anime Quiz!')
            .setDescription('**Quem é esse personagem?**\nVocê tem **15 segundos** para digitar o nome exato dele no chat!')
            .setImage(character.image.large);

        await msg.edit({ content: '', embeds: [embed] });

        const filter = m => m.content.toLowerCase() === charName;
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async m => {
            const guildId = message.guild.id;
            const userId = m.author.id;
            const reward = 300;

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [] };

            kakeraConfig[guildId][userId].balance += reward;
            await saveData('kakeraConfig.json', kakeraConfig);

            m.reply(`🎉 **CERTA RESPOSTA!** Parabéns, ${m.author}, o personagem era **${character.name.full}**!\n💎 Você ganhou **${reward} Kakeras**!`);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send(`⏱️ O tempo acabou! Ninguém adivinhou.\nO personagem era: **${character.name.full}**.`);
            }
        });
    }
};
