const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['ajuda', 'comandos'],
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('📜 Comandos da Naolli')
            .setDescription('Prefixo: `n!` | Use `n!help` para ver esta lista.\n\u200b')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🛠️ Utilidade', value: '`ping`, `help`, `weather`, `poll`, `serverinfo`, `avatar`', inline: false },
                { name: '🛡️ Servidor', value: '`ban`, `kick`, `prune`, `autorole`, `invite`, `nickname`, `announcer`, `divulgar`', inline: false },
                { name: '⚙️ Painéis de Config', value: '`serversetup` (Twitch/Boas-vindas) | `setup` (Esports: CS2, Valorant, LoL, OW)', inline: false },
                { name: '📈 Sistema de Nível', value: '`level` (`rank`) — XP e nível | `setlevelrole <nível> @Cargo`', inline: false },
                { name: '\u200b', value: '**━━━━━ 🎴 GACHA & COLEÇÃO ━━━━━**', inline: false },
                { name: '💖 Coleção', value: '`roll` (`w`/`waifu`), `harem` (`mm`), `profile`, `fm`, `im` (personagem), `ima` (anime), `give`, `trade`, `sm` (ordenar), `divorce`, `top`, `topserv`, `left`', inline: false },
                { name: '🔍 Pesquisa', value: '`wish` — wishlist (notifica ao rolar) | `wishlist` (`wl`) — ver lista', inline: false },
                { name: '🎨 Customização', value: '`color <hex> <personagem>` (500K) | `note <nome>|<texto>` (200K) | `alias <apelido>|<nome>` (grátis)', inline: false },
                { name: '💎 Economia Kakera', value: '`kakera` (`k`) | `dailykakera` (`dk`) | `givekakera` (`gk`) | `kakeratower` (`kt`) | `topservk`', inline: false },
                { name: '🔮 Mercado Kakera', value: '`loja` (`shop`) — itens e inventário | `kakeraloot` (`kl`) — caixa misteriosa | `mercadonegro` (`mn`) — loja secreta diária', inline: false },
                { name: '🔧 Gacha Admin', value: '`mk` (spawnar K) | `togglekakera` | `cleankakera` | `givescrap` | `kakerascrap`', inline: false },
                { name: '\u200b', value: '**━━━━━ ⚔️ RPG & JOGOS ━━━━━**', inline: false },
                { name: '⚔️ Sistema RPG', value: '`batalha` (`fight`) — luta contra monstros | `rpgperfil` (`rpg`) — seus stats | `duel @user <K>` — duelo PvP', inline: false },
                { name: '🎰 Cassino', value: '`slots <valor>` — Caça-Níqueis | `coinflip <cara/coroa> <valor>` | `quiz` — Anime Quiz (+300K)', inline: false },
                { name: '\u200b', value: '**━━━━━ 🌐 SOCIAL & SERVIDOR ━━━━━**', inline: false },
                { name: '💍 Social', value: '`casamento @user` — pedido de casamento | `casamento info` — certidão | `casamento divorcio`', inline: false },
                { name: '🏰 Sistema de Clãs', value: '`clan lista` | `clan criar <nome>` (1000K) | `clan info` | `clan convidar @user` | `clan depositar <K>` | `clan sair` | `clan dissolver`', inline: false },
                { name: '🎉 Eventos', value: '`giveaway <min> <K> [msg]` (Admin) — Sorteio de Kakeras | `conquistas` (`ach`) — seus troféus', inline: false },
                { name: '\u200b', value: '**━━━━━ 🎲 DIVERSÃO ━━━━━**', inline: false },
                { name: '🎲 Diversão', value: '`8ball`, `say`, `avatar`, `cat`, `dog`, `gif`, `meme`, `chucknorris`, `advice`, `animegif`, `bored`, `rps`, `kanye`, `insult`', inline: false }
            )
            .setFooter({ text: 'Naolli Bot • Feito com 💕 para o servidor' });

        message.reply({ embeds: [embed] });
    }
};
