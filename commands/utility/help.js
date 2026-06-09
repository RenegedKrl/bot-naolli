const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['ajuda', 'comandos'],
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('📜 Meus Comandos')
            .setDescription('Aqui estão todos os comandos que eu posso executar. Meu prefixo atual é `n!`.')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🛠️ Utilidade', value: '`ping`, `help`, `weather`, `poll`', inline: false },
                { name: '🛡️ Servidor', value: '`ban`, `kick`, `prune`, `autorole`, `invite`, `nickname`, `announcer`, `divulgar`', inline: false },
                { name: '⚙️ Painéis de Configuração', value: '`serversetup` — Configura alertas da **Twitch** e mensagem de **Boas-Vindas** interativamente\n`setup` — Configura alertas de Esports (**CS2, Valorant, LoL, Overwatch**) interativamente', inline: false },
                { name: '📈 Sistema de Nível', value: '`level` (ou `rank` / `xp`) — mostra seu nível e XP\n`setlevelrole <nível> @Cargo` — define a recompensa do nível (Admin)', inline: false },
                { name: '💖 Coleção (Gacha)', value: '`roll` (`w`), `harem` (`mm`), `profile`, `fm`, `im` (Personagem), `ima` (Anime), `give`, `trade`, `sm` (Organizar), `divorce`, `top` (Rank Global), `topserv`, `left`', inline: false },
                { name: '💎 Economia Kakera', value: '`kakera` (`k`), `dailykakera` (`dk`), `kr` (Recompensas/Badges), `givekakera` (`gk`), `kakeratower` (`kt`), `topservk`', inline: false },
                { name: '🔧 Gacha Admin', value: '`mk` (Spawn Kakera), `togglekakera`, `cleankakera`, `givescrap`, `kakerascrap`', inline: false },
                { name: '🎲 Diversão & Imagens', value: '`8ball`, `say`, `avatar`, `cat`, `dog`, `gif`, `meme`, `chucknorris`, `advice`, `animegif`, `bored`, `gintama`, `jojo`, `kanye`, `insult`, `rps`', inline: false }
            )
            .setFooter({ text: 'Naolli Bot • Feito para você ❤️' });

        message.reply({ embeds: [embed] });
    }
};
