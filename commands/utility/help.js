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
                { name: '🛠️ Utilidade', value: '`ping`, `help`, `weather`, `poll`, `serverinfo`, `userinfo` (`whois`), `avatar`, `lembrete` (`remind`)', inline: false },
                { name: '🛡️ Servidor', value: '`ban`, `kick`, `prune`, `autorole`, `invite`, `nickname`, `announcer`, `divulgar`\n`automod` — filtros palavra/link | `reactionrole criar` (`rr`) — painel de cargos', inline: false },
                { name: '⚙️ Painéis de Config', value: '`serversetup` (Twitch/Boas-vindas) | `setup` (Esports: CS2, Valorant, LoL, OW)', inline: false },
                { name: '📈 Sistema de Nível', value: '`level` (`rank`) — XP e nível no chat | `setlevelrole <nível> @Cargo`', inline: false },
                { name: '\u200b', value: '**━━━━━━━━ 🎴 GACHA & COLEÇÃO ━━━━━━━━**', inline: false },
                { name: '💖 Coleção', value: '`roll` (`w`/`waifu`), `harem` (`mm`), `profile`, `fm`, `im` (personagem), `ima` (anime), `give`, `trade`, `sm` (ordenar), `divorce`, `top`, `topserv`, `left`', inline: false },
                { name: '🔍 Pesquisa & Wishlist', value: '`wish <nome>` — adicionar à wishlist | `wishlist` (`wl`) — ver lista', inline: false },
                { name: '🎨 Customização de Cartas', value: '`color <hex> <nome>` (500K) | `note <nome>|<texto>` (200K) | `alias <apelido>|<nome>`', inline: false },
                { name: '💎 Economia Kakera', value: '`kakera` (`k`) | `dailykakera` (`dk`) | `trabalhar` (`work`) | `givekakera` (`gk`) | `kakeratower` (`kt`) | `topservk`', inline: false },
                { name: '🔮 Mercado & Lojas', value: '`loja` (`shop`) — itens RPG/tickets | `kakeraloot` (`kl`) — caixa misteriosa | `mercadonegro` (`mn`) — itens exclusivos diários', inline: false },
                { name: '🔧 Gacha Admin', value: '`mk` (spawnar K) | `togglekakera` | `cleankakera` | `givescrap` | `kakerascrap`', inline: false },
                { name: '\u200b', value: '**━━━━━━━━ ⚔️ RPG & JOGOS ━━━━━━━━**', inline: false },
                { name: '⚔️ Sistema RPG', value: '`batalha` (`fight`) — lutar contra monstros | `rpgperfil` (`rpg`) — seus stats | `duel @user <K>` — PvP', inline: false },
                { name: '🎰 Cassino & Jogos', value: '`slots <K>` | `coinflip <cara/coroa> <K>` | `blackjack <K>` (`bj`) | `corrida <K> <nº>` | `adivinhar <K>` | `quiz`', inline: false },
                { name: '🎲 Jogos em Grupo', value: '`forca [categoria]` — Jogo da Forca multiplayer | `batalhanaval @user <K>` (`naval`) — PvP Batalha Naval', inline: false },
                { name: '🐾 Pet Virtual', value: '`pet adotar` | `pet alimentar` | `pet brincar` | `pet status` | `pet abandonar`', inline: false },
                { name: '\u200b', value: '**━━━━━━━━ 🌐 SOCIAL & SERVIDOR ━━━━━━━━**', inline: false },
                { name: '💍 Social', value: '`casamento @user` — pedido | `casamento info` — certidão | `casamento divorcio`\n`rep @user` — +1 reputação diária | `rep info @user`', inline: false },
                { name: '🏰 Sistema de Clãs', value: '`clan lista` | `clan criar <nome>` (1000K) | `clan info` | `clan convidar @user` | `clan depositar <K>` | `clan sair` | `clan dissolver`', inline: false },
                { name: '🎉 Eventos & Conquistas', value: '`giveaway <min> <K> [msg]` (Admin) | `conquistas` (`ach`) — 10 troféus com recompensas', inline: false },
                { name: '📋 Missões Diárias', value: '`missoes` (`quests`) — 3 missões por dia | `missoes resgatar <nº>` — coletar recompensa em Kakera', inline: false },
                { name: '\u200b', value: '**━━━━━━━━ 🎲 DIVERSÃO ━━━━━━━━**', inline: false },
                { name: '🎲 Diversão', value: '`8ball`, `say`, `avatar`, `cat`, `dog`, `gif`, `meme`, `chucknorris`, `advice`, `animegif`, `bored`, `rps`, `kanye`, `insult`', inline: false }
            )
            .setFooter({ text: 'Naolli Bot • Feito com 💕 | Use n!help para ver esta lista' });

        message.reply({ embeds: [embed] });
    }
};
