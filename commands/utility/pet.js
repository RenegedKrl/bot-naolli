const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const PETS = [
    { id: 'slime', name: 'Slime', emoji: '🟢', rare: false },
    { id: 'fox', name: 'Raposa', emoji: '🦊', rare: false },
    { id: 'cat', name: 'Gato Espiritual', emoji: '😸', rare: false },
    { id: 'dragon', name: 'Dragão Bebê', emoji: '🐉', rare: true },
    { id: 'phoenix', name: 'Fênix', emoji: '🔥', rare: true },
    { id: 'void', name: 'Gato do Void', emoji: '🌑', rare: true },
];

const EVOLUTIONS = {
    1: { name: 'Filhote', bonus: { atk: 0, def: 0 } },
    2: { name: 'Jovem', bonus: { atk: 5, def: 3 } },
    3: { name: 'Adulto', bonus: { atk: 15, def: 10 } },
    4: { name: 'Ancião', bonus: { atk: 30, def: 20 } },
    5: { name: '⭐ Lendário', bonus: { atk: 60, def: 40 } },
};

async function getPet(guildId, userId) {
    let pets = await getData('petData.json') || {};
    return pets[guildId]?.[userId] || null;
}

module.exports = {
    name: 'pet',
    aliases: ['bichinho', 'mascote'],
    description: 'Sistema de Pet Virtual!',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        let petsDb = await getData('petData.json') || {};
        if (!petsDb[guildId]) petsDb[guildId] = {};

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const pet = petsDb[guildId][userId];
            if (!pet) {
                return message.reply('🥚 Você não tem um pet! Use `n!pet adotar` para escolher um companheiro.');
            }
            const evo = EVOLUTIONS[pet.stage] || EVOLUTIONS[1];
            const hungerBar = '🟩'.repeat(Math.ceil(pet.hunger / 10)) + '⬛'.repeat(10 - Math.ceil(pet.hunger / 10));
            const happyBar = '💛'.repeat(Math.ceil(pet.happiness / 10)) + '⬛'.repeat(10 - Math.ceil(pet.happiness / 10));
            const xpBar = '█'.repeat(Math.floor((pet.xp / pet.xpNeeded) * 10)) + '░'.repeat(10 - Math.floor((pet.xp / pet.xpNeeded) * 10));

            const timeSinceFed = pet.lastFed ? Math.floor((Date.now() - pet.lastFed) / 3600000) : 99;
            if (timeSinceFed > 6) {
                pet.hunger = Math.max(0, pet.hunger - Math.floor(timeSinceFed / 2));
                pet.happiness = Math.max(0, pet.happiness - Math.floor(timeSinceFed / 3));
                petsDb[guildId][userId] = pet;
                await saveData('petData.json', petsDb);
            }

            const embed = new EmbedBuilder()
                .setColor(pet.rare ? '#FFD700' : '#32CD32')
                .setTitle(`${pet.emoji} ${pet.name} — ${evo.name}`)
                .setDescription(`*Estágio ${pet.stage}/5* — +${evo.bonus.atk} ATK, +${evo.bonus.def} DEF nas batalhas RPG`)
                .addFields(
                    { name: '🍖 Fome', value: hungerBar + ` ${pet.hunger}/100`, inline: false },
                    { name: '💛 Felicidade', value: happyBar + ` ${pet.happiness}/100`, inline: false },
                    { name: '✨ Experiência', value: `\`${xpBar}\` ${pet.xp}/${pet.xpNeeded}`, inline: false }
                )
                .setFooter({ text: 'Alimenta com n!pet alimentar | Brinca com n!pet brincar' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'adotar' || sub === 'adopt') {
            if (petsDb[guildId][userId]) return message.reply('❌ Você já tem um pet! Abandone o atual com `n!pet abandonar` antes de adotar outro.');

            const availablePets = PETS.filter(p => !p.rare);
            const chosen = availablePets[Math.floor(Math.random() * availablePets.length)];

            petsDb[guildId][userId] = {
                id: chosen.id, name: chosen.name, emoji: chosen.emoji, rare: chosen.rare,
                stage: 1, xp: 0, xpNeeded: 200,
                hunger: 100, happiness: 100,
                lastFed: Date.now(), lastPlayed: Date.now()
            };
            await saveData('petData.json', petsDb);
            return message.reply(`🎉 Você adotou um **${chosen.emoji} ${chosen.name}**! Cuide bem dele com \`n!pet alimentar\` e \`n!pet brincar\`.`);
        }

        if (sub === 'alimentar' || sub === 'feed') {
            const pet = petsDb[guildId][userId];
            if (!pet) return message.reply('❌ Você não tem um pet!');

            const cooldown = 2 * 60 * 60 * 1000;
            if (pet.lastFed && Date.now() - pet.lastFed < cooldown) {
                const left = Math.ceil((cooldown - (Date.now() - pet.lastFed)) / 60000);
                return message.reply(`⏳ Seu pet não está com fome ainda! Volte em **${left} minutos**.`);
            }

            petsDb[guildId][userId].hunger = Math.min(100, pet.hunger + 30);
            petsDb[guildId][userId].xp += 20;
            petsDb[guildId][userId].lastFed = Date.now();

            let levelMsg = '';
            if (petsDb[guildId][userId].xp >= petsDb[guildId][userId].xpNeeded && pet.stage < 5) {
                petsDb[guildId][userId].xp -= petsDb[guildId][userId].xpNeeded;
                petsDb[guildId][userId].stage++;
                petsDb[guildId][userId].xpNeeded *= 2;
                const newEvo = EVOLUTIONS[petsDb[guildId][userId].stage];
                levelMsg = `\n🆙 **${pet.name}** evoluiu para **${newEvo.name}**! (Estágio ${petsDb[guildId][userId].stage}/5)`;
            }
            await saveData('petData.json', petsDb);
            return message.reply(`🍖 Você alimentou **${pet.emoji} ${pet.name}**! (+30 Fome, +20 XP)${levelMsg}`);
        }

        if (sub === 'brincar' || sub === 'play') {
            const pet = petsDb[guildId][userId];
            if (!pet) return message.reply('❌ Você não tem um pet!');

            const cooldown = 3 * 60 * 60 * 1000;
            if (pet.lastPlayed && Date.now() - pet.lastPlayed < cooldown) {
                const left = Math.ceil((cooldown - (Date.now() - pet.lastPlayed)) / 60000);
                return message.reply(`⏳ Seu pet está cansado! Descanse **${left} minutos** mais.`);
            }

            petsDb[guildId][userId].happiness = Math.min(100, pet.happiness + 25);
            petsDb[guildId][userId].xp += 30;
            petsDb[guildId][userId].lastPlayed = Date.now();

            let levelMsg = '';
            if (petsDb[guildId][userId].xp >= petsDb[guildId][userId].xpNeeded && pet.stage < 5) {
                petsDb[guildId][userId].xp -= petsDb[guildId][userId].xpNeeded;
                petsDb[guildId][userId].stage++;
                petsDb[guildId][userId].xpNeeded *= 2;
                const newEvo = EVOLUTIONS[petsDb[guildId][userId].stage];
                levelMsg = `\n🆙 **${pet.name}** evoluiu para **${newEvo.name}**!`;
            }
            await saveData('petData.json', petsDb);
            return message.reply(`🎾 Você brincou com **${pet.emoji} ${pet.name}**! (+25 Felicidade, +30 XP)${levelMsg}`);
        }

        if (sub === 'abandonar' || sub === 'release') {
            if (!petsDb[guildId][userId]) return message.reply('❌ Você não tem um pet!');
            const petName = petsDb[guildId][userId].name;
            delete petsDb[guildId][userId];
            await saveData('petData.json', petsDb);
            return message.reply(`😢 Você abandonou **${petName}**... Esperamos que encontre um novo lar.`);
        }
    }
};
