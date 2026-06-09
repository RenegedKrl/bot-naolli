const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

const SUITS = ['♠️', '♥️', '♣️', '♦️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
    return SUITS.flatMap(s => VALUES.map(v => ({ suit: s, value: v })));
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function cardValue(card) {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
}

function handTotal(hand) {
    let total = hand.reduce((s, c) => s + cardValue(c), 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function handStr(hand, hideSecond = false) {
    return hand.map((c, i) => (hideSecond && i === 1) ? '🂠' : `${c.suit}${c.value}`).join(' ');
}

module.exports = {
    name: 'blackjack',
    aliases: ['bj', '21'],
    description: 'Jogue Blackjack contra o dealer! Aposte seus Kakeras.',
    async execute(message, args) {
        const aposta = parseInt(args[0]);
        if (!aposta || aposta <= 0) return message.reply('⚠️ Use: `n!blackjack <valor>` | Ex: `n!blackjack 200`');

        const guildId = message.guild.id;
        const userId = message.author.id;

        let kakeraConfig = await getData('kakeraConfig.json') || {};
        if (!kakeraConfig[guildId]?.[userId] || kakeraConfig[guildId][userId].balance < aposta) {
            return message.reply(`❌ Você não tem **${aposta} Kakeras** para apostar!`);
        }

        kakeraConfig[guildId][userId].balance -= aposta;
        await saveData('kakeraConfig.json', kakeraConfig);

        const deck = shuffle(createDeck());
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const buildEmbed = (ended = false, msg = '') => {
            const playerTotal = handTotal(playerHand);
            const dealerTotal = ended ? handTotal(dealerHand) : cardValue(dealerHand[0]);
            return new EmbedBuilder()
                .setColor('#1a472a')
                .setTitle('🃏 Blackjack')
                .addFields(
                    { name: `🎩 Dealer (${ended ? dealerTotal : '?'})`, value: handStr(dealerHand, !ended), inline: false },
                    { name: `🧑 Você (${playerTotal})`, value: handStr(playerHand), inline: false }
                )
                .setDescription(msg || (ended ? '' : '**H** — Pedir carta | **S** — Parar | **D** — Dobrar (2x aposta)'))
                .setFooter({ text: `Aposta: ${aposta} Kakeras` });
        };

        const gameMsg = await message.reply({ embeds: [buildEmbed()] });

        // Blackjack natural
        if (handTotal(playerHand) === 21) {
            const winAmount = Math.floor(aposta * 2.5);
            kakeraConfig[guildId][userId].balance += winAmount;
            await saveData('kakeraConfig.json', kakeraConfig);
            return gameMsg.edit({ embeds: [buildEmbed(true, `🎉 **BLACKJACK!** Você ganhou **${winAmount} Kakeras**!`)] });
        }

        const filter = m => m.author.id === userId && ['h', 's', 'd', 'hit', 'stand', 'dobrar'].includes(m.content.toLowerCase());
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        let doubled = false;

        collector.on('collect', async m => {
            m.delete().catch(() => {});
            const action = m.content.toLowerCase();

            if (action === 'h' || action === 'hit') {
                playerHand.push(deck.pop());
                const total = handTotal(playerHand);
                if (total > 21) {
                    collector.stop('bust');
                } else if (total === 21) {
                    collector.stop('stand');
                } else {
                    await gameMsg.edit({ embeds: [buildEmbed()] });
                }
            } else if (action === 'd' || action === 'dobrar') {
                if (!doubled && kakeraConfig[guildId][userId].balance >= aposta) {
                    kakeraConfig[guildId][userId].balance -= aposta;
                    await saveData('kakeraConfig.json', kakeraConfig);
                    doubled = true;
                    playerHand.push(deck.pop());
                    collector.stop(handTotal(playerHand) > 21 ? 'bust' : 'stand');
                } else {
                    message.channel.send('❌ Não é possível dobrar!').then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
                }
            } else {
                collector.stop('stand');
            }
        });

        collector.on('end', async (_, reason) => {
            const playerTotal = handTotal(playerHand);
            kakeraConfig = await getData('kakeraConfig.json') || {};
            const betAmount = doubled ? aposta * 2 : aposta;

            if (reason === 'bust') {
                gameMsg.edit({ embeds: [buildEmbed(true, `💥 **Estourou! (${playerTotal})** Você perdeu **${betAmount} Kakeras**.`)] });
                return;
            }

            // Dealer joga
            while (handTotal(dealerHand) < 17) dealerHand.push(deck.pop());
            const dealerTotal = handTotal(dealerHand);

            let resultMsg = '';
            let gain = 0;

            if (dealerTotal > 21 || playerTotal > dealerTotal) {
                gain = betAmount * 2;
                resultMsg = `🏆 **Você venceu! (${playerTotal} vs ${dealerTotal})** +**${gain} Kakeras**!`;
            } else if (playerTotal === dealerTotal) {
                gain = betAmount;
                resultMsg = `🤝 **Empate! (${playerTotal})** Aposta devolvida.`;
            } else {
                resultMsg = `😔 **Dealer venceu! (${dealerTotal} vs ${playerTotal})** Perdeu **${betAmount} Kakeras**.`;
            }

            if (gain > 0) {
                kakeraConfig[guildId][userId].balance += gain;
                await saveData('kakeraConfig.json', kakeraConfig);
            }

            gameMsg.edit({ embeds: [buildEmbed(true, resultMsg)] });
        });
    }
};
