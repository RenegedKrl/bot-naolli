const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const SIX_HOURS = 6 * 60 * 60 * 1000;

// Calcula o valor base dinâmico (XP e Kakera) usando os favoritos com variação aleatória de +/- 15%
function getDynamicValue(favorites) {
    let baseValue = Math.floor(favorites / 100) + 20;
    const variation = Math.floor(baseValue * 0.15);
    const randomOffset = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
    return baseValue + randomOffset;
}

// Raridade e Valores baseados em favoritos do Anilist
function getRarity(favorites) {
    const value = getDynamicValue(favorites);
    if (favorites > 50000) return { name: '🟡 Lendária', color: '#FFD700', xp: value };
    if (favorites > 20000) return { name: '🟣 Épica',    color: '#8A2BE2', xp: value };
    if (favorites > 5000)  return { name: '🔵 Rara',     color: '#1E90FF', xp: value };
    if (favorites > 1000)  return { name: '🟢 Incomum',  color: '#32CD32', xp: value  };
    return                        { name: '⚪ Comum',    color: '#b0b0b0', xp: value  };
}

async function checkLimits(guildId, userId) {
    const limits = await getData('gachaLimits.json');
    const key = `${guildId}_${userId}`;

    if (!limits[key]) {
        limits[key] = { rolls: 10, lastRollReset: Date.now(), claims: 1, lastClaimReset: Date.now() };
    }

    const now = Date.now();
    if (now - limits[key].lastRollReset > SIX_HOURS) {
        limits[key].rolls = 10;
        limits[key].lastRollReset = now;
    }
    if (now - limits[key].lastClaimReset > SIX_HOURS) {
        limits[key].claims = 1;
        limits[key].lastClaimReset = now;
    }

    await saveData('gachaLimits.json', limits);
    return limits[key];
}

async function updateLimits(guildId, userId, type, amount) {
    const limits = await getData('gachaLimits.json');
    const key = `${guildId}_${userId}`;
    if (limits[key]) {
        limits[key][type] -= amount;
        await saveData('gachaLimits.json', limits);
    }
}

async function fetchAnilistCharacter(genderFilter) {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const query = `query {
        Page(page: ${randomPage}, perPage: 50) {
            characters(sort: FAVOURITES_DESC) {
                id
                name { full }
                gender
                favourites
                image { large }
                media(sort: POPULARITY_DESC, perPage: 1) {
                    nodes { title { romaji } }
                }
            }
        }
    }`;

    const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error(`Anilist HTTP ${res.status}`);

    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);

    let chars = json.data.Page.characters;
    if (genderFilter) chars = chars.filter(c => c.gender === genderFilter);
    if (chars.length === 0) return null;

    return chars[Math.floor(Math.random() * chars.length)];
}

module.exports = {
    name: 'roll',
    aliases: ['w', 'waifu', 'husbando', 'h'],
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId  = message.author.id;

        const userLimits = await checkLimits(guildId, userId);

        if (userLimits.rolls <= 0) {
            const timeLeft = SIX_HOURS - (Date.now() - userLimits.lastRollReset);
            const hours   = Math.floor(timeLeft / 3600000);
            const minutes = Math.floor((timeLeft % 3600000) / 60000);
            return message.reply(`⏳ Você ficou sem rolls! Volte em **${hours}h e ${minutes}m**.`);
        }

        let genderFilter = null;
        if (args[0]) {
            const a = args[0].toLowerCase();
            if (a === 'f' || a === 'w') genderFilter = 'Female';
            if (a === 'm' || a === 'h') genderFilter = 'Male';
        }

        await updateLimits(guildId, userId, 'rolls', 1);
        const msg = await message.reply(`🎲 Rolando... (Restam **${userLimits.rolls - 1}** rolls)`);

        try {
            // Tenta buscar até 3 vezes
            let character = null;
            for (let i = 0; i < 3 && !character; i++) {
                character = await fetchAnilistCharacter(genderFilter);
            }

            if (!character) {
                return msg.edit('❌ Nenhum personagem encontrado. Tente novamente.');
            }

            const charId   = character.id.toString();
            const charName = character.name.full;
            const animeName = character.media.nodes[0]?.title?.romaji ?? 'Origem Desconhecida';
            const imageUrl  = character.image.large;
            const favorites = character.favourites ?? 0;
            const rarity    = getRarity(favorites);

            let config = await getData('gachaConfig.json');
            if (!config[guildId]) config[guildId] = {};

            // Conta em quantos servidores esse personagem já foi pego
            let globalClaims = 0;
            for (const guildData of Object.values(config)) {
                if (guildData[charId]) globalClaims++;
            }

            const isClaimed = config[guildId][charId];

            const embed = new EmbedBuilder()
                .setColor(isClaimed ? '#FF0000' : rarity.color)
                .setTitle(charName)
                .setDescription(
                    `📺 **${animeName}**\n\n` +
                    `${rarity.name} · +${rarity.xp} XP\n` +
                    `🌐 Possuído em **${globalClaims}** servidor(es)`
                )
                .setImage(imageUrl)
                .setFooter({ text: `⭐ ${favorites.toLocaleString()} favoritos no Anilist` });

            if (isClaimed) {
                const owner = message.guild.members.cache.get(isClaimed.ownerId);
                embed.addFields({ name: '💔 Já pertence a:', value: owner ? owner.user.username : 'Alguém' });
                await msg.edit({ content: '', embeds: [embed] });

                // Lógica da Reação de Kakera (Mudae-style)
                const kakeraValue = rarity.xp; // Coincide perfeitamente: 500, 250, 100, 50, 10
                await msg.react('💎');

                const kakeraFilter = (reaction, user) => reaction.emoji.name === '💎' && !user.bot;
                const kakeraCollector = msg.createReactionCollector({ filter: kakeraFilter, time: 30000, max: 1 });

                kakeraCollector.on('collect', async (reaction, user) => {
                    let kakeraConfig = await getData('kakeraConfig.json');
                    if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
                    if (!kakeraConfig[guildId][user.id]) kakeraConfig[guildId][user.id] = { balance: 0, badges: [] };

                    kakeraConfig[guildId][user.id].balance += kakeraValue;
                    await saveData('kakeraConfig.json', kakeraConfig);

                    message.channel.send(`💎 **${user.username}** reagiu primeiro e ganhou **${kakeraValue} Kakeras** do personagem repetido!`);
                });

                kakeraCollector.on('end', (collected, reason) => {
                    if (reason !== 'limit') {
                        msg.reactions.removeAll().catch(() => {});
                    }
                });

                return;
            }

            await msg.edit({ content: '💖 Reaja para casar com este personagem!', embeds: [embed] });
            await msg.react('💖');

            const filter    = (reaction, user) => reaction.emoji.name === '💖' && !user.bot;
            const collector = msg.createReactionCollector({ filter, time: 45000 });

            collector.on('collect', async (reaction, user) => {
                const clickerLimits = await checkLimits(guildId, user.id);
                if (clickerLimits.claims <= 0) {
                    message.channel.send(`❌ ${user}, você já se casou nas últimas 6 horas!`);
                    return reaction.users.remove(user.id).catch(() => {});
                }

                let currentConfig = await getData('gachaConfig.json');
                if (!currentConfig[guildId]) currentConfig[guildId] = {};

                if (currentConfig[guildId][charId]) {
                    return message.channel.send(`❌ Desculpe ${user}, alguém foi mais rápido!`);
                }

                currentConfig[guildId][charId] = {
                    ownerId: user.id,
                    name: charName,
                    anime: animeName,
                    imageUrl: imageUrl,
                    rarity: rarity.name
                };
                await saveData('gachaConfig.json', currentConfig);
                await updateLimits(guildId, user.id, 'claims', 1);

                // XP / Nível
                let profiles = await getData('userProfile.json');
                if (!profiles[guildId]) profiles[guildId] = {};
                if (!profiles[guildId][user.id]) profiles[guildId][user.id] = { xp: 0, level: 1 };

                profiles[guildId][user.id].xp += rarity.xp;
                let leveledUp = false;
                const xpNeeded = profiles[guildId][user.id].level * 1000;
                if (profiles[guildId][user.id].xp >= xpNeeded) {
                    profiles[guildId][user.id].xp -= xpNeeded;
                    profiles[guildId][user.id].level++;
                    leveledUp = true;
                }
                await saveData('userProfile.json', profiles);

                embed.addFields({ name: '💍 Casado(a) com:', value: `<@${user.id}>` });
                const lvlMsg = leveledUp
                    ? `\n🆙 Subiu para nível **${profiles[guildId][user.id].level}** de Colecionador!`
                    : '';

                msg.edit({
                    content: `🎉 **${user.username}** casou com a versão **${rarity.name}** de **${charName}** (+${rarity.xp} XP)!${lvlMsg}`,
                    embeds: [embed]
                });
                collector.stop('claimed');
            });

            collector.on('end', (_, reason) => {
                if (reason !== 'claimed') {
                    msg.reactions.removeAll().catch(() => {});
                    embed.setColor('#2F3136');
                    msg.edit({ content: '⏱️ Tempo esgotado! Ninguém quis esse personagem.', embeds: [embed] });
                }
            });

        } catch (error) {
            console.error('[ROLL ERROR] Tipo:', error.constructor.name);
            console.error('[ROLL ERROR] Mensagem:', error.message);
            console.error('[ROLL ERROR] Stack:', error.stack);
            msg.edit(`❌ Erro ao conectar com a API de animes. \`${error.message}\``);
        }
    }
};
