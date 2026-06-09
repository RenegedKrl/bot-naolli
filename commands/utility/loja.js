const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const SHOP_ITEMS = [
    { id: 'potionhp', name: '🧪 Poção de HP', description: '+50 HP máximo para batalhas RPG', price: 500 },
    { id: 'potionatk', name: '⚔️ Elixir de Força', description: '+10 ATK permanente para batalhas RPG', price: 800 },
    { id: 'potiondef', name: '🛡️ Elixir de Defesa', description: '+10 DEF permanente para batalhas RPG', price: 800 },
    { id: 'rollticket', name: '🎟️ Ticket de Roll', description: '+3 rolls extras imediatos no gacha', price: 300 },
    { id: 'claimticket', name: '💖 Ticket de Claim', description: '+1 claim extra imediato no gacha', price: 600 },
    { id: 'xpboost', name: '✨ Boost de XP (1h)', description: 'Dobra o XP de coleção por 1 hora', price: 1000 },
    { id: 'protecao', name: '🔒 Proteção de Kakera', description: 'Protege você de perder Kakeras no duelo (1x)', price: 1500 },
];

module.exports = {
    name: 'loja',
    aliases: ['shop', 'store', 'comprar'],
    description: 'Loja de itens com Kakeras.',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (!args.length) {
            const embed = new EmbedBuilder()
                .setColor('#FF8C00')
                .setTitle('🏪 Loja Kakera')
                .setDescription('Use `n!loja comprar <id>` para comprar um item.\n\n' +
                    SHOP_ITEMS.map(i => `\`${i.id}\` — **${i.name}**\n${i.description}\n💎 Preço: **${i.price} K**`).join('\n\n'))
                .setFooter({ text: 'Dica: n!loja inventario para ver seus itens.' });
            return message.reply({ embeds: [embed] });
        }

        if (args[0].toLowerCase() === 'inventario' || args[0].toLowerCase() === 'inv') {
            let inventory = await getData('playerInventory.json') || {};
            const userInv = inventory[guildId]?.[userId] || {};
            const items = Object.entries(userInv).filter(([, v]) => v > 0);

            const embed = new EmbedBuilder()
                .setColor('#FF8C00')
                .setTitle(`🎒 Inventário de ${message.author.username}`)
                .setDescription(items.length ? items.map(([id, qty]) => {
                    const item = SHOP_ITEMS.find(i => i.id === id);
                    return `${item?.name || id}: **${qty}x**`;
                }).join('\n') : '*Inventário vazio! Compre itens na `n!loja`.*');
            return message.reply({ embeds: [embed] });
        }

        if (args[0].toLowerCase() === 'comprar' || args[0].toLowerCase() === 'buy') {
            const itemId = args[1]?.toLowerCase();
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (!item) return message.reply('❌ Item não encontrado! Use `n!loja` para ver os IDs disponíveis.');

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]?.[userId] || kakeraConfig[guildId][userId].balance < item.price) {
                return message.reply(`❌ Você não tem **${item.price} Kakeras** para comprar ${item.name}!`);
            }

            // Compra o item
            kakeraConfig[guildId][userId].balance -= item.price;
            await saveData('kakeraConfig.json', kakeraConfig);

            let inventory = await getData('playerInventory.json') || {};
            if (!inventory[guildId]) inventory[guildId] = {};
            if (!inventory[guildId][userId]) inventory[guildId][userId] = {};
            inventory[guildId][userId][item.id] = (inventory[guildId][userId][item.id] || 0) + 1;
            await saveData('playerInventory.json', inventory);

            // Aplicar efeito imediato em alguns itens
            if (item.id === 'rollticket') {
                let limits = await getData('gachaLimits.json') || {};
                const key = `${guildId}_${userId}`;
                if (!limits[key]) limits[key] = { rolls: 0, claims: 0, lastRollReset: Date.now(), lastClaimReset: Date.now() };
                limits[key].rolls += 3;
                await saveData('gachaLimits.json', limits);
                inventory[guildId][userId][item.id]--;
                await saveData('playerInventory.json', inventory);
            } else if (item.id === 'claimticket') {
                let limits = await getData('gachaLimits.json') || {};
                const key = `${guildId}_${userId}`;
                if (!limits[key]) limits[key] = { rolls: 0, claims: 0, lastRollReset: Date.now(), lastClaimReset: Date.now() };
                limits[key].claims += 1;
                await saveData('gachaLimits.json', limits);
                inventory[guildId][userId][item.id]--;
                await saveData('playerInventory.json', inventory);
            } else if (['potionhp', 'potionatk', 'potiondef'].includes(item.id)) {
                let rpg = await getData('rpgData.json') || {};
                if (!rpg[guildId]) rpg[guildId] = {};
                if (!rpg[guildId][userId]) rpg[guildId][userId] = { level: 1, hp: 100, maxHp: 100, atk: 20, def: 10, xp: 0, xpNeeded: 100 };

                if (item.id === 'potionhp') rpg[guildId][userId].maxHp += 50;
                if (item.id === 'potionatk') rpg[guildId][userId].atk += 10;
                if (item.id === 'potiondef') rpg[guildId][userId].def += 10;
                await saveData('rpgData.json', rpg);
                inventory[guildId][userId][item.id]--;
                await saveData('playerInventory.json', inventory);
            }

            message.reply(`✅ Comprou **${item.name}** por **${item.price} Kakeras**!\n💎 Saldo restante: ${kakeraConfig[guildId][userId].balance} K`);
        }
    }
};
