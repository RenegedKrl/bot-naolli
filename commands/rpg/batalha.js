const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../../database');

const MONSTERS = [
    { name: 'Slime Azul', emoji: '🟦', hp: 50, atk: 8, def: 2, reward: 30, xp: 15, rarity: 'Comum' },
    { name: 'Goblin Guerreiro', emoji: '👺', hp: 80, atk: 15, def: 5, reward: 60, xp: 30, rarity: 'Comum' },
    { name: 'Lobo das Sombras', emoji: '🐺', hp: 120, atk: 22, def: 8, reward: 100, xp: 50, rarity: 'Incomum' },
    { name: 'Ogro do Pântano', emoji: '👾', hp: 200, atk: 30, def: 15, reward: 180, xp: 80, rarity: 'Raro' },
    { name: 'Cavaleiro Esqueleto', emoji: '💀', hp: 180, atk: 35, def: 20, reward: 220, xp: 100, rarity: 'Raro' },
    { name: 'Dragão Jovem', emoji: '🐉', hp: 350, atk: 50, def: 25, reward: 400, xp: 180, rarity: 'Épico' },
    { name: 'Deus das Trevas', emoji: '👁️', hp: 500, atk: 70, def: 40, reward: 700, xp: 300, rarity: 'Lendário' }
];

const RARITY_COLORS = {
    'Comum': '#b0b0b0', 'Incomum': '#32CD32', 'Raro': '#1E90FF',
    'Épico': '#8A2BE2', 'Lendário': '#FFD700'
};

async function getPlayerStats(guildId, userId) {
    let rpg = await getData('rpgData.json') || {};
    if (!rpg[guildId]) rpg[guildId] = {};
    if (!rpg[guildId][userId]) {
        rpg[guildId][userId] = { level: 1, hp: 100, maxHp: 100, atk: 20, def: 10, xp: 0, xpNeeded: 100 };
        await saveData('rpgData.json', rpg);
    }
    return rpg[guildId][userId];
}

module.exports = {
    name: 'batalha',
    aliases: ['battle', 'fight', 'luta'],
    description: 'Lute contra monstros para ganhar Kakeras e XP de RPG!',
    async execute(message) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        let rpg = await getData('rpgData.json') || {};
        if (!rpg[guildId]) rpg[guildId] = {};

        const player = await getPlayerStats(guildId, userId);

        // Cooldown de 30 segundos
        if (player.lastBattle && Date.now() - player.lastBattle < 30000) {
            const timeLeft = Math.ceil((30000 - (Date.now() - player.lastBattle)) / 1000);
            return message.reply(`⏳ Você ainda está recuperando fôlego! Aguarde **${timeLeft}s**.`);
        }

        // Monstro baseado no nível do player
        const maxIndex = Math.min(Math.floor(player.level / 2), MONSTERS.length - 1);
        const monster = { ...MONSTERS[Math.floor(Math.random() * (maxIndex + 1))] };

        let playerHp = player.maxHp;
        let monsterHp = monster.hp;
        let turnCount = 0;
        const battleLog = [];

        // Simula a batalha em rounds
        while (playerHp > 0 && monsterHp > 0 && turnCount < 20) {
            turnCount++;
            const playerDmg = Math.max(1, player.atk - monster.def + Math.floor(Math.random() * 10));
            const monsterDmg = Math.max(1, monster.atk - player.def + Math.floor(Math.random() * 8));

            monsterHp -= playerDmg;
            if (monsterHp > 0) playerHp -= monsterDmg;

            if (turnCount <= 3) battleLog.push(`Turn ${turnCount}: ⚔️ +${playerDmg} dmg → ${monster.emoji} HP: ${Math.max(0, monsterHp)} | 💢 +${monsterDmg} dmg → 🧙 HP: ${Math.max(0, playerHp)}`);
        }

        const vitoria = playerHp > 0 && monsterHp <= 0;

        rpg[guildId][userId].lastBattle = Date.now();

        const embed = new EmbedBuilder()
            .setColor(vitoria ? RARITY_COLORS[monster.rarity] : '#FF0000')
            .setTitle(vitoria ? `⚔️ Vitória contra ${monster.emoji} ${monster.name}!` : `💀 Derrota para ${monster.emoji} ${monster.name}...`)
            .setDescription(battleLog.join('\n') + '\n`...`')
            .addFields({ name: 'HP Final:', value: `${Math.max(0, playerHp)}/${player.maxHp}`, inline: true });

        if (vitoria) {
            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]) kakeraConfig[guildId] = {};
            if (!kakeraConfig[guildId][userId]) kakeraConfig[guildId][userId] = { balance: 0, badges: [] };

            kakeraConfig[guildId][userId].balance += monster.reward;
            await saveData('kakeraConfig.json', kakeraConfig);

            rpg[guildId][userId].xp += monster.xp;
            let levelUp = false;
            while (rpg[guildId][userId].xp >= rpg[guildId][userId].xpNeeded) {
                rpg[guildId][userId].xp -= rpg[guildId][userId].xpNeeded;
                rpg[guildId][userId].level++;
                rpg[guildId][userId].maxHp += 20;
                rpg[guildId][userId].atk += 5;
                rpg[guildId][userId].def += 2;
                rpg[guildId][userId].xpNeeded = rpg[guildId][userId].level * 100;
                levelUp = true;
            }
            await saveData('rpgData.json', rpg);

            embed.addFields(
                { name: '💎 Kakeras:', value: `+${monster.reward}`, inline: true },
                { name: '✨ XP RPG:', value: `+${monster.xp}`, inline: true }
            );

            if (levelUp) {
                embed.addFields({ name: '🆙 LEVEL UP!', value: `Você subiu para o nível RPG **${rpg[guildId][userId].level}**!\n+20 HP máx | +5 ATK | +2 DEF`, inline: false });
            }
        } else {
            await saveData('rpgData.json', rpg);
        }

        embed.setFooter({ text: `Nível RPG: ${rpg[guildId][userId].level} | XP: ${rpg[guildId][userId].xp}/${rpg[guildId][userId].xpNeeded}` });
        message.reply({ embeds: [embed] });
    }
};
