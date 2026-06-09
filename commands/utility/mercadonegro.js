const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const BLACK_MARKET_ITEMS = [
    { id: 'bm_legendary_ticket', name: '⭐ Ticket Lendário', description: 'Garante um personagem Lendário no próximo roll (1 uso)', price: 3000, stock: 1 },
    { id: 'bm_steal_protect', name: '🛡️ Escudo de Reação', description: 'Seus Kakeras de reação são dobrados por 24h', price: 2000, stock: 2 },
    { id: 'bm_megaboost', name: '🚀 Mega Boost', description: '+100 de tudo nas stats RPG permanentemente', price: 5000, stock: 1 },
    { id: 'bm_ghost', name: '👻 Modo Fantasma', description: 'Fica invisível na classificação Kakera por 12h', price: 1500, stock: 3 },
    { id: 'bm_claim_reset', name: '💖 Reset Total de Claims', description: 'Reseta seu claim para 3 usos imediatamente', price: 2500, stock: 2 },
];

module.exports = {
    name: 'mercadonegro',
    aliases: ['blackmarket', 'mn', 'bm'],
    description: 'Loja secreta com itens exclusivos que mudam todo dia! (n!mn)',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        // Seed do dia para que os itens do dia sejam consistentes por servidor
        const today = new Date().toISOString().slice(0, 10);
        const seed = parseInt(today.replace(/-/g, '')) % BLACK_MARKET_ITEMS.length;
        const todayItems = [...BLACK_MARKET_ITEMS].sort(() => {
            const hash = seed * 9301 + 49297;
            return (hash % 233280) / 233280 - 0.5;
        }).slice(0, 3);

        if (!args.length) {
            const embed = new EmbedBuilder()
                .setColor('#1a1a2e')
                .setTitle('🕵️ Mercado Negro')
                .setDescription(`*Psst... estoque renovado todo dia. Não conte pra ninguém.*\n\nUse \`n!mn comprar <id>\` para comprar.\n\n` +
                    todayItems.map(i => `\`${i.id}\` — **${i.name}**\n${i.description}\n💎 Preço: **${i.price} K** | Estoque: ${i.stock}x`).join('\n\n'))
                .setFooter({ text: `Renova meia-noite! (${today})` });
            return message.reply({ embeds: [embed] });
        }

        if (args[0].toLowerCase() === 'comprar' || args[0].toLowerCase() === 'buy') {
            const itemId = args[1]?.toLowerCase();
            const item = todayItems.find(i => i.id === itemId);
            if (!item) return message.reply('❌ Este item não está disponível hoje! Confira com `n!mn`.');

            let bmStock = await getData('bmStock.json') || {};
            if (!bmStock[today]) bmStock[today] = {};
            const soldToday = bmStock[today][itemId] || 0;
            if (soldToday >= item.stock) return message.reply('❌ Este item está **esgotado** hoje!');

            let kakeraConfig = await getData('kakeraConfig.json') || {};
            if (!kakeraConfig[guildId]?.[userId] || kakeraConfig[guildId][userId].balance < item.price) {
                return message.reply(`❌ Você não tem **${item.price} Kakeras**!`);
            }

            kakeraConfig[guildId][userId].balance -= item.price;
            await saveData('kakeraConfig.json', kakeraConfig);

            bmStock[today][itemId] = soldToday + 1;
            await saveData('bmStock.json', bmStock);

            // Efeitos imediatos
            let limits = await getData('gachaLimits.json') || {};
            const key = `${guildId}_${userId}`;

            if (item.id === 'bm_claim_reset') {
                if (!limits[key]) limits[key] = { rolls: 10, claims: 3, lastRollReset: Date.now(), lastClaimReset: Date.now() };
                limits[key].claims = 3;
                await saveData('gachaLimits.json', limits);
            } else if (item.id === 'bm_megaboost') {
                let rpg = await getData('rpgData.json') || {};
                if (!rpg[guildId]) rpg[guildId] = {};
                if (!rpg[guildId][userId]) rpg[guildId][userId] = { level: 1, maxHp: 100, atk: 20, def: 10, xp: 0, xpNeeded: 100 };
                rpg[guildId][userId].maxHp += 100;
                rpg[guildId][userId].atk += 100;
                rpg[guildId][userId].def += 100;
                await saveData('rpgData.json', rpg);
            }

            // Salva no inventário (para itens de uso posterior)
            if (['bm_legendary_ticket', 'bm_steal_protect', 'bm_ghost'].includes(item.id)) {
                let inventory = await getData('playerInventory.json') || {};
                if (!inventory[guildId]) inventory[guildId] = {};
                if (!inventory[guildId][userId]) inventory[guildId][userId] = {};
                inventory[guildId][userId][item.id] = (inventory[guildId][userId][item.id] || 0) + 1;
                await saveData('playerInventory.json', inventory);
            }

            message.reply(`🕵️ Transação concluída. **${item.name}** é seu! Não diga a ninguém...\n💎 Saldo: ${kakeraConfig[guildId][userId].balance} K`);
        }
    }
};
