const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');
const { getCharacterSkin } = require('./skinManager');

const SIX_HOURS = 6 * 60 * 60 * 1000;

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

module.exports = {
    name: 'roll',
    aliases: ['w', 'waifu', 'husbando', 'h'],
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        
        const userLimits = await checkLimits(guildId, userId);
        
        if (userLimits.rolls <= 0) {
            const timeLeft = SIX_HOURS - (Date.now() - userLimits.lastRollReset);
            const hours = Math.floor(timeLeft / 3600000);
            const minutes = Math.floor((timeLeft % 3600000) / 60000);
            return message.reply(`⏳ Você ficou sem rolls! Volte em **${hours}h e ${minutes}m**.`);
        }

        let genderFilter = null;
        if (args[0]) {
            if (args[0].toLowerCase() === 'f' || args[0].toLowerCase() === 'w') genderFilter = 'Female';
            if (args[0].toLowerCase() === 'm' || args[0].toLowerCase() === 'h') genderFilter = 'Male';
        }

        await updateLimits(guildId, userId, 'rolls', 1);

        const msg = await message.reply(`🎲 Rolando... (Restam **${userLimits.rolls - 1}** rolls)`);

        try {
            let character = null;
            let attempts = 0;
            
            while (!character && attempts < 3) {
                attempts++;
                const randomPage = Math.floor(Math.random() * 100) + 1;
                const query = `
                query { 
                    Page(page: ${randomPage}, perPage: 50) { 
                        characters(sort: FAVOURITES_DESC) { 
                            id name { full } gender favorites image { large } 
                            media(sort: POPULARITY_DESC, perPage: 1) { nodes { title { romaji } } } 
                        } 
                    } 
                }`;

                const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
                const res = await fetchFn('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const data = await res.json();
                if (data.errors) continue;

                let chars = data.data.Page.characters;
                
                if (genderFilter) {
                    chars = chars.filter(c => c.gender === genderFilter);
                }
                
                if (chars.length > 0) {
                    character = chars[Math.floor(Math.random() * chars.length)];
                }
            }

            if (!character) return msg.edit('❌ Erro ao buscar personagem. Tente novamente.');

            let config = await getData('gachaConfig.json');
            if (!config[guildId]) config[guildId] = {};

            const charId = character.id.toString();
            const charName = character.name.full;
            const animeName = character.media.nodes.length > 0 ? character.media.nodes[0].title.romaji : 'Origem Desconhecida';
            const imageUrl = character.image.large;

            const skinData = await getCharacterSkin(charId, charName, imageUrl);

            const finalImageUrl = skinData.url;
            const rarity = skinData.rarity;
            const embedColor = skinData.color;
            const points = skinData.xp;

            // Conta globalmente quantas pessoas já têm esse personagem
            let globalClaims = 0;
            for (const guildData of Object.values(config)) {
                if (guildData[charId]) globalClaims++;
            }

            const isClaimed = config[guildId][charId];

            const embed = new EmbedBuilder()
                .setTitle(charName)
                .setDescription(`Anime/Mangá: **${animeName}**\n\n🌟 Raridade da Imagem: **${rarity}** (+${points} XP)\n🌐 Personagem possuído em: **${globalClaims}** servidor(es)`)
                .setImage(finalImageUrl)
                .setFooter({ text: `ID: ${charId}` });

            if (isClaimed) {
                embed.setColor('#FF0000');
                const owner = message.guild.members.cache.get(isClaimed.ownerId);
                embed.addFields({ name: '💔 Já pertence a:', value: owner ? owner.user.username : 'Alguém' });
                return msg.edit({ content: '', embeds: [embed] });
            }

            embed.setColor(embedColor);
            await msg.edit({ content: '💖 Reaja rápido para casar com este personagem!', embeds: [embed] });
            await msg.react('💖');

            const filter = (reaction, user) => reaction.emoji.name === '💖' && !user.bot;
            const collector = msg.createReactionCollector({ filter, time: 45000 });

            collector.on('collect', async (reaction, user) => {
                const clickerLimits = await checkLimits(guildId, user.id);
                if (clickerLimits.claims <= 0) {
                    message.channel.send(`❌ ${user}, você já se casou nas últimas 6 horas! Espere seu tempo resetar.`);
                    return reaction.users.remove(user.id).catch(() => {});
                }

                let currentConfig = await getData('gachaConfig.json');
                if (!currentConfig[guildId]) currentConfig[guildId] = {};
                
                if (currentConfig[guildId][charId]) {
                    return message.channel.send(`❌ Desculpe ${user}, mas alguém foi mais rápido!`);
                }

                currentConfig[guildId][charId] = {
                    ownerId: user.id,
                    name: charName,
                    anime: animeName,
                    imageUrl: finalImageUrl,
                    rarity: rarity
                };
                await saveData('gachaConfig.json', currentConfig);
                
                await updateLimits(guildId, user.id, 'claims', 1);

                // Sistema de Nível/XP
                let profileConfig = await getData('userProfile.json') || {};
                if (!profileConfig[guildId]) profileConfig[guildId] = {};
                if (!profileConfig[guildId][user.id]) profileConfig[guildId][user.id] = { xp: 0, level: 1 };

                profileConfig[guildId][user.id].xp += points;
                let leveledUp = false;
                let currentLevel = profileConfig[guildId][user.id].level;
                const xpNeeded = currentLevel * 1000;

                if (profileConfig[guildId][user.id].xp >= xpNeeded) {
                    profileConfig[guildId][user.id].xp -= xpNeeded;
                    profileConfig[guildId][user.id].level++;
                    leveledUp = true;
                }
                await saveData('userProfile.json', profileConfig);

                embed.addFields({ name: '💍 Casado(a) com:', value: `<@${user.id}>` });
                
                let levelMsg = leveledUp ? `\n🆙 **Subiu de Nível!** Você agora é nível de Colecionador **${profileConfig[guildId][user.id].level}**!` : '';
                
                msg.edit({ content: `🎉 Parabéns ${user}! Você casou com a versão **${rarity}** de **${charName}** e ganhou **${points} XP**!${levelMsg}`, embeds: [embed] });
                collector.stop('claimed');
            });

            collector.on('end', (collected, reason) => {
                if (reason !== 'claimed') {
                    msg.reactions.removeAll().catch(() => {});
                    embed.setColor('#2F3136');
                    msg.edit({ content: '⏱️ Tempo esgotado! Ninguém quis esse personagem.', embeds: [embed] });
                }
            });

        } catch (error) {
            console.error(error);
            msg.edit('❌ Erro na conexão com a API de animes.');
        }
    }
};
