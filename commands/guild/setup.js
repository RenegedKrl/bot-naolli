const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getData, saveData } = require('../../database');

const GAMES = {
    'csgo': { name: 'Counter-Strike 2', emoji: '🔫', color: '#E4A322' },
    'valorant': { name: 'Valorant', emoji: '🎯', color: '#FF4655' },
    'lol': { name: 'League of Legends', emoji: '⚔️', color: '#C8AA6E' },
    'ow': { name: 'Overwatch', emoji: '🛡️', color: '#F99E1A' }
};

module.exports = {
    name: 'setup',
    aliases: ['config', 'painel'],
    description: 'Painel de configuração de Esports',
    async execute(message, args, client) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de **Gerenciar Servidor** para usar o setup.');
        }

        const gameSelect = new StringSelectMenuBuilder()
            .setCustomId('setup_game_select')
            .setPlaceholder('Selecione um jogo para configurar')
            .addOptions(
                Object.entries(GAMES).map(([id, game]) => ({
                    label: game.name,
                    value: id,
                    emoji: game.emoji
                }))
            );

        const row = new ActionRowBuilder().addComponents(gameSelect);

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('⚙️ Painel de Configuração — Esports')
            .setDescription('Bem-vindo ao painel central de configurações!\nAqui você pode ativar e definir os canais de **Notícias**, **Partidas ao Vivo** e **Resultados** para os principais jogos do cenário competitivo.\n\n👇 **Selecione um jogo no menu abaixo para começar:**')
            .setFooter({ text: 'Apenas administradores podem alterar as configurações.' });

        const botMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = botMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000 // 5 minutos
        });

        let currentGame = null;

        collector.on('collect', async interaction => {
            if (interaction.customId === 'setup_game_select') {
                currentGame = interaction.values[0];
                await updateGamePanel(interaction, currentGame);
            } else if (interaction.customId.startsWith('setup_channel_')) {
                const type = interaction.customId.split('_')[2]; // news, live, result
                const channelId = interaction.values[0];
                await saveChannelConfig(message.guild.id, currentGame, type, channelId);
                await updateGamePanel(interaction, currentGame, `✅ Canal de **${type}** definido com sucesso!`);
            } else if (interaction.customId.startsWith('setup_remove_')) {
                const type = interaction.customId.split('_')[2];
                await saveChannelConfig(message.guild.id, currentGame, type, null);
                await updateGamePanel(interaction, currentGame, `🗑️ Canal de **${type}** removido! As notificações foram desativadas.`);
            }
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                StringSelectMenuBuilder.from(gameSelect).setDisabled(true)
            );
            botMessage.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};

async function getGameConfig(guildId, game) {
    // Para manter compatibilidade com os arquivos do CS2 que já existem
    if (game === 'csgo') {
        const live = await getData('csAlertsConfig.json');
        const result = await getData('csResultConfig.json');
        const news = await getData('csNewsConfig.json');
        return {
            live: live[guildId]?.channelId || null,
            result: result[guildId]?.channelId || null,
            news: news[guildId]?.channelId || null
        };
    } else {
        const data = await getData(`${game}Config.json`);
        return data[guildId] || { live: null, result: null, news: null };
    }
}

async function saveChannelConfig(guildId, game, type, channelId) {
    if (game === 'csgo') {
        const fileMap = { live: 'csAlertsConfig.json', result: 'csResultConfig.json', news: 'csNewsConfig.json' };
        const file = fileMap[type];
        const data = await getData(file);
        if (!data[guildId]) data[guildId] = {};
        if (channelId) data[guildId].channelId = channelId;
        else delete data[guildId];
        await saveData(file, data);
    } else {
        const file = `${game}Config.json`;
        const data = await getData(file);
        if (!data[guildId]) data[guildId] = {};
        data[guildId][type] = channelId;
        await saveData(file, data);
    }
}

async function updateGamePanel(interaction, gameId, alertMsg = null) {
    const game = GAMES[gameId];
    const config = await getGameConfig(interaction.guildId, gameId);

    const embed = new EmbedBuilder()
        .setColor(game.color)
        .setTitle(`${game.emoji} Configuração: ${game.name}`)
        .setDescription(`Defina os canais onde o bot deve enviar os alertas para **${game.name}**.\n\n` +
            `📡 **Partidas ao Vivo:** ${config.live ? `<#${config.live}>` : '❌ Desativado'}\n` +
            `🏆 **Resultados:** ${config.result ? `<#${config.result}>` : '❌ Desativado'}\n` +
            `📰 **Notícias:** ${config.news ? `<#${config.news}>` : '❌ Desativado'}` +
            (alertMsg ? `\n\n${alertMsg}` : '')
        );

    const rowLive = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('setup_channel_live')
            .setPlaceholder('Escolha o canal para Partidas ao Vivo')
            .setChannelTypes(ChannelType.GuildText)
    );
    
    const rowResult = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('setup_channel_result')
            .setPlaceholder('Escolha o canal para Resultados')
            .setChannelTypes(ChannelType.GuildText)
    );

    const rowNews = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('setup_channel_news')
            .setPlaceholder('Escolha o canal para Notícias')
            .setChannelTypes(ChannelType.GuildText)
    );

    const removeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('setup_remove_live')
            .setLabel('Remover Ao Vivo')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!config.live),
        new ButtonBuilder()
            .setCustomId('setup_remove_result')
            .setLabel('Remover Resultado')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!config.result),
        new ButtonBuilder()
            .setCustomId('setup_remove_news')
            .setLabel('Remover Notícias')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!config.news)
    );

    // Re-adicionar o menu de jogos no topo para voltar
    const gameSelect = new StringSelectMenuBuilder()
        .setCustomId('setup_game_select')
        .setPlaceholder('Configurando: ' + game.name)
        .addOptions(
            Object.entries(GAMES).map(([id, g]) => ({
                label: g.name,
                value: id,
                emoji: g.emoji,
                default: id === gameId
            }))
        );
    const rowGames = new ActionRowBuilder().addComponents(gameSelect);

    await interaction.update({ embeds: [embed], components: [rowGames, rowLive, rowResult, rowNews, removeRow] });
}
