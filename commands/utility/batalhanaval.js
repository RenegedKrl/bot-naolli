const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../../database');

const SHIPS = [
    { name: 'Battleship', emoji: '⚓', hp: 4, hits: [] },
    { name: 'Cruiser', emoji: '🚢', hp: 3, hits: [] },
    { name: 'Destroyer', emoji: '🛥️', hp: 2, hits: [] },
];

module.exports = {
    name: 'batalhanaval',
    aliases: ['naval', 'bnaval'],
    description: 'Desafie alguém para uma batalha naval! Aposte Kakeras.',
    async execute(message, args) {
        const opponent = message.mentions.users.first();
        const aposta = parseInt(args[1]);

        if (!opponent || opponent.bot || !aposta || aposta < 50) {
            return message.reply('⚠️ Use: `n!batalhanaval @oponente <aposta mín. 50>`\nEx: `n!batalhanaval @amigo 300`');
        }
        if (opponent.id === message.author.id) return message.reply('❌ Você não pode jogar contra si mesmo!');

        const guildId = message.guild.id;
        const p1id = message.author.id;
        const p2id = opponent.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if ((kakeraConfig[guildId]?.[p1id]?.balance || 0) < aposta) return message.reply(`❌ Você não tem ${aposta} Kakeras!`);
        if ((kakeraConfig[guildId]?.[p2id]?.balance || 0) < aposta) return message.reply(`❌ ${opponent.username} não tem ${aposta} Kakeras!`);

        const inviteMsg = await message.channel.send(`⚓ **${message.author.username}** desafia **${opponent}** em Batalha Naval por **${aposta} Kakeras**!\nReaja ✅ para aceitar.`);
        await inviteMsg.react('✅');
        await inviteMsg.react('❌');

        const inviteFilter = (r, u) => ['✅', '❌'].includes(r.emoji.name) && u.id === p2id;
        const inviteCollected = await inviteMsg.awaitReactions({ filter: inviteFilter, time: 30000, max: 1 });
        if (!inviteCollected.size || inviteCollected.first().emoji.name === '❌') {
            return inviteMsg.edit(`❌ ${opponent.username} recusou.`);
        }

        // Gera tabuleiros 5x5
        function genBoard() {
            const grid = Array(5).fill(null).map(() => Array(5).fill('🟦'));
            const ships = [4, 3, 2].map((size, i) => ({ size, name: ['Battleship', 'Cruiser', 'Destroyer'][i], hits: 0 }));
            const placed = [];
            for (const ship of ships) {
                let placed_ok = false;
                while (!placed_ok) {
                    const horiz = Math.random() > 0.5;
                    const row = Math.floor(Math.random() * 5);
                    const col = Math.floor(Math.random() * (5 - ship.size + 1));
                    let ok = true;
                    const cells = [];
                    for (let i = 0; i < ship.size; i++) {
                        const r = horiz ? row : row + i;
                        const c = horiz ? col + i : col;
                        if (r >= 5 || c >= 5 || grid[r][c] !== '🟦') { ok = false; break; }
                        cells.push([r, c]);
                    }
                    if (ok) {
                        for (const [r, c] of cells) grid[r][c] = ship.name[0];
                        placed.push({ ...ship, cells });
                        placed_ok = true;
                    }
                }
            }
            return { grid, ships: placed };
        }

        function displayBoard(grid, reveal = false) {
            const header = '`A B C D E`';
            return header + '\n' + grid.map((row, i) => {
                const cols = row.map(cell => {
                    if (cell === '💥') return '💥';
                    if (cell === '❌') return '❌';
                    if (reveal && cell !== '🟦') return '🚢';
                    return '🟦';
                }).join('');
                return `\`${i + 1}\` ${cols}`;
            }).join('\n');
        }

        const p1board = genBoard();
        const p2board = genBoard();

        // Deduz apostas
        kakeraConfig[guildId][p1id].balance -= aposta;
        kakeraConfig[guildId][p2id].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        let currentPlayer = p1id;
        let turn = 1;

        const COLS = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };

        const gameEmbed = () => new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle('⚓ Batalha Naval')
            .setDescription(`**Turno ${turn}** — Vez de <@${currentPlayer}>!\n\nDigite coordenada (ex: \`B3\`) para atacar!`)
            .addFields(
                { name: `🟦 Tabuleiro de <@${p1id}>`, value: displayBoard(p1board.grid), inline: true },
                { name: `🟦 Tabuleiro de <@${p2id}>`, value: displayBoard(p2board.grid), inline: true }
            )
            .setFooter({ text: `Aposta: ${aposta * 2} Kakeras em jogo!` });

        const gameMsg = await message.channel.send({ embeds: [gameEmbed()] });

        const filter = m => m.author.id === currentPlayer && /^[a-eA-E][1-5]$/.test(m.content.trim());
        
        async function playTurn() {
            const collector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });
            
            collector.on('collect', async m => {
                m.delete().catch(() => {});
                const col = COLS[m.content[0].toLowerCase()];
                const row = parseInt(m.content[1]) - 1;

                const targetBoard = currentPlayer === p1id ? p2board : p1board;
                const cell = targetBoard.grid[row][col];

                if (cell === '💥' || cell === '❌') {
                    await message.channel.send('⚠️ Já atacou esse ponto! Escolha outro.').then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
                    return playTurn();
                }

                if (cell !== '🟦') {
                    targetBoard.grid[row][col] = '💥';
                    const ship = targetBoard.ships.find(s => s.name[0] === cell);
                    if (ship) ship.hits++;
                    await message.channel.send(`💥 **ACERTO!** na coordenada \`${m.content.toUpperCase()}\`!`);
                } else {
                    targetBoard.grid[row][col] = '❌';
                    await message.channel.send(`💨 Água em \`${m.content.toUpperCase()}\`.`);
                }

                // Verifica se ganhou
                const allSunk = targetBoard.ships.every(s => s.hits >= s.size);
                if (allSunk) {
                    kakeraConfig = await getData('kakeraConfig.json') || {};
                    kakeraConfig[guildId][currentPlayer].balance += aposta * 2;
                    await saveData('kakeraConfig.json', kakeraConfig);

                    const winEmbed = new EmbedBuilder()
                        .setColor('#FFD700')
                        .setTitle('⚓ Batalha Naval — FIM!')
                        .setDescription(`🏆 <@${currentPlayer}> afundou todos os navios e ganhou **${aposta * 2} Kakeras**!`)
                        .addFields(
                            { name: `Tabuleiro de <@${p1id}>`, value: displayBoard(p1board.grid, true), inline: true },
                            { name: `Tabuleiro de <@${p2id}>`, value: displayBoard(p2board.grid, true), inline: true }
                        );
                    gameMsg.edit({ embeds: [winEmbed] });
                    return;
                }

                turn++;
                currentPlayer = currentPlayer === p1id ? p2id : p1id;
                await gameMsg.edit({ embeds: [gameEmbed()] });
                playTurn();
            });

            collector.on('end', (c, reason) => {
                if (reason === 'time') {
                    message.channel.send(`⏱️ <@${currentPlayer}> demorou demais! Jogo encerrado. Apostas devolvidas.`);
                    getData('kakeraConfig.json').then(async cfg => {
                        cfg[guildId][p1id].balance += aposta;
                        cfg[guildId][p2id].balance += aposta;
                        await saveData('kakeraConfig.json', cfg);
                    });
                }
            });
        }

        await playTurn();
    }
};
