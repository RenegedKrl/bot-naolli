const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'serversetup',
    aliases: ['social', 'painelservidor'],
    description: 'Painel interativo para configurar a Twitch e as Boas-Vindas do servidor.',
    async execute(message, args, client) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de **Gerenciar Servidor** para usar este painel.');
        }

        const menuSelect = new StringSelectMenuBuilder()
            .setCustomId('social_select')
            .setPlaceholder('Escolha o que deseja configurar')
            .addOptions(
                { label: 'Alertas da Twitch', value: 'twitch', emoji: '👾', description: 'Configure os alertas de lives' },
                { label: 'Boas-Vindas', value: 'welcome', emoji: '👋', description: 'Configure a mensagem de entrada' }
            );

        const row = new ActionRowBuilder().addComponents(menuSelect);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🛠️ Painel do Servidor')
            .setDescription('Bem-vindo ao painel de configurações do servidor!\n\nAqui você pode configurar todos os **Alertas da Twitch** e também a **Mensagem de Boas-Vindas** de forma totalmente interativa.\n\n👇 **Selecione uma opção abaixo para começar:**')
            .setFooter({ text: 'Apenas administradores podem modificar isso.' });

        const botMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = botMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 600000 // 10 minutos
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'social_select') {
                const choice = interaction.values[0];
                if (choice === 'twitch') {
                    await updateTwitchPanel(interaction);
                } else if (choice === 'welcome') {
                    await updateWelcomePanel(interaction);
                }
            } 
            else if (interaction.customId === 'social_twitch_channel') {
                const channelId = interaction.values[0];
                let config = await getData('twitchConfig.json');
                if (!config[interaction.guildId]) config[interaction.guildId] = { streamers: [], channelId: null };
                config[interaction.guildId].channelId = channelId;
                await saveData('twitchConfig.json', config);
                await updateTwitchPanel(interaction, `✅ Canal da Twitch definido para <#${channelId}>!`);
            }
            else if (interaction.customId === 'social_welcome_channel') {
                const channelId = interaction.values[0];
                let config = await getData('welcomeConfig.json');
                if (!config[interaction.guildId]) config[interaction.guildId] = {};
                config[interaction.guildId].channelId = channelId;
                await saveData('welcomeConfig.json', config);
                await updateWelcomePanel(interaction, `✅ Canal de Boas-Vindas definido para <#${channelId}>!`);
            }
            else if (interaction.customId === 'btn_twitch_add') {
                const modal = new ModalBuilder().setCustomId('modal_twitch_add').setTitle('Adicionar Streamer');
                const input = new TextInputBuilder()
                    .setCustomId('streamer_name')
                    .setLabel('Nome do streamer na Twitch:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: alanzoka')
                    .setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_twitch_remove') {
                const modal = new ModalBuilder().setCustomId('modal_twitch_remove').setTitle('Remover Streamer');
                const input = new TextInputBuilder()
                    .setCustomId('streamer_name')
                    .setLabel('Nome do streamer para remover:')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_welcome_text') {
                let config = await getData('welcomeConfig.json');
                const currentText = config[interaction.guildId]?.text || 'Bem-vindo(a) ao {server}, {user}!';
                
                const modal = new ModalBuilder().setCustomId('modal_welcome_text').setTitle('Mensagem de Boas-Vindas');
                const input = new TextInputBuilder()
                    .setCustomId('welcome_msg')
                    .setLabel('Sua mensagem (Use {user} e {server}):')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(currentText)
                    .setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_welcome_btn') {
                const modal = new ModalBuilder().setCustomId('modal_welcome_btn').setTitle('Botão do Embed de Boas-Vindas');
                const inputUrl = new TextInputBuilder()
                    .setCustomId('btn_url')
                    .setLabel('Link (URL) do Botão:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://seusite.com')
                    .setRequired(true);
                const inputLabel = new TextInputBuilder()
                    .setCustomId('btn_label')
                    .setLabel('Texto do Botão:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Visite nosso site!')
                    .setRequired(true);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(inputUrl),
                    new ActionRowBuilder().addComponents(inputLabel)
                );
                await interaction.showModal(modal);
            }
        });

        // Interceptador global do Client para Modais enviados por este comando
        // (Seria melhor colocar no interactionCreate global, mas para manter isolado, faremos aqui)
        const modalListener = async (interaction) => {
            if (!interaction.isModalSubmit()) return;
            
            if (interaction.customId === 'modal_twitch_add') {
                const name = interaction.fields.getTextInputValue('streamer_name').toLowerCase();
                let config = await getData('twitchConfig.json');
                const guildId = interaction.guildId;
                if (!config[guildId]) config[guildId] = { streamers: [], channelId: null };
                if (!config[guildId].streamers.includes(name)) config[guildId].streamers.push(name);
                await saveData('twitchConfig.json', config);
                await interaction.reply({ content: `✅ Streamer **${name}** adicionado com sucesso!`, ephemeral: true });
                await updateTwitchPanel(interaction.message.components ? { ...interaction, update: () => interaction.message.edit } : null, null, guildId, interaction.message);
            } 
            else if (interaction.customId === 'modal_twitch_remove') {
                const name = interaction.fields.getTextInputValue('streamer_name').toLowerCase();
                let config = await getData('twitchConfig.json');
                const guildId = interaction.guildId;
                if (config[guildId] && config[guildId].streamers) {
                    config[guildId].streamers = config[guildId].streamers.filter(s => s !== name);
                    await saveData('twitchConfig.json', config);
                    await interaction.reply({ content: `🗑️ Streamer **${name}** removido!`, ephemeral: true });
                    await updateTwitchPanel(null, null, guildId, interaction.message);
                } else {
                    await interaction.reply({ content: '❌ Erro ao remover.', ephemeral: true });
                }
            }
            else if (interaction.customId === 'modal_welcome_text') {
                const text = interaction.fields.getTextInputValue('welcome_msg');
                let config = await getData('welcomeConfig.json');
                const guildId = interaction.guildId;
                if (!config[guildId]) config[guildId] = {};
                config[guildId].text = text;
                await saveData('welcomeConfig.json', config);
                await interaction.reply({ content: '✅ Texto de Boas-Vindas atualizado!', ephemeral: true });
                await updateWelcomePanel(null, null, guildId, interaction.message);
            }
            else if (interaction.customId === 'modal_welcome_btn') {
                const url = interaction.fields.getTextInputValue('btn_url');
                const label = interaction.fields.getTextInputValue('btn_label');
                if (!url.startsWith('http')) return interaction.reply({ content: '❌ A URL deve começar com http:// ou https://', ephemeral: true });
                let config = await getData('welcomeConfig.json');
                const guildId = interaction.guildId;
                if (!config[guildId]) config[guildId] = {};
                config[guildId].buttonUrl = url;
                config[guildId].buttonLabel = label;
                await saveData('welcomeConfig.json', config);
                await interaction.reply({ content: '✅ Botão de Boas-Vindas atualizado!', ephemeral: true });
                await updateWelcomePanel(null, null, guildId, interaction.message);
            }
        };

        client.on('interactionCreate', modalListener);

        collector.on('end', () => {
            botMessage.edit({ components: [] }).catch(() => {});
            client.removeListener('interactionCreate', modalListener);
        });
    }
};

async function updateTwitchPanel(interaction, alertMsg = null, forceGuildId = null, forceMessage = null) {
    const guildId = interaction?.guildId || forceGuildId;
    let config = await getData('twitchConfig.json');
    const guildConfig = config[guildId] || { streamers: [], channelId: null };

    const streamersList = guildConfig.streamers.length > 0 ? guildConfig.streamers.join(', ') : 'Nenhum streamer adicionado.';

    const embed = new EmbedBuilder()
        .setColor('#9146FF')
        .setTitle('👾 Configuração: Alertas da Twitch')
        .setDescription(`Defina o canal e adicione streamers para serem anunciados.\n\n` +
            `📡 **Canal de Alertas:** ${guildConfig.channelId ? `<#${guildConfig.channelId}>` : '❌ Não definido'}\n` +
            `📺 **Streamers Vigiados:** ${streamersList}` +
            (alertMsg ? `\n\n${alertMsg}` : '')
        );

    const channelSelectRow = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('social_twitch_channel')
            .setPlaceholder('Escolher canal de anúncios da Twitch')
            .setChannelTypes(ChannelType.GuildText)
    );

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_twitch_add').setLabel('Adicionar Streamer').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('btn_twitch_remove').setLabel('Remover Streamer').setStyle(ButtonStyle.Danger).setEmoji('➖')
    );

    const backRow = getBackMenu('twitch');

    if (interaction && interaction.update) {
        await interaction.update({ embeds: [embed], components: [backRow, channelSelectRow, btnRow] });
    } else if (forceMessage) {
        await forceMessage.edit({ embeds: [embed], components: [backRow, channelSelectRow, btnRow] });
    }
}

async function updateWelcomePanel(interaction, alertMsg = null, forceGuildId = null, forceMessage = null) {
    const guildId = interaction?.guildId || forceGuildId;
    let config = await getData('welcomeConfig.json');
    const guildConfig = config[guildId] || {};

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('👋 Configuração: Boas-Vindas')
        .setDescription(`Defina a mensagem de entrada dos membros do servidor.\n\n` +
            `📡 **Canal de Entrada:** ${guildConfig.channelId ? `<#${guildConfig.channelId}>` : '❌ Não definido'}\n` +
            `📝 **Texto:** ${guildConfig.text ? guildConfig.text : 'Bem-vindo(a) ao {server}, {user}!'}\n` +
            `🔗 **Botão URL:** ${guildConfig.buttonUrl ? `[${guildConfig.buttonLabel}](${guildConfig.buttonUrl})` : '❌ Não definido'}` +
            (alertMsg ? `\n\n${alertMsg}` : '')
        );

    const channelSelectRow = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('social_welcome_channel')
            .setPlaceholder('Escolher canal de Boas-Vindas')
            .setChannelTypes(ChannelType.GuildText)
    );

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_welcome_text').setLabel('Editar Mensagem').setStyle(ButtonStyle.Primary).setEmoji('📝'),
        new ButtonBuilder().setCustomId('btn_welcome_btn').setLabel('Editar Botão de Link').setStyle(ButtonStyle.Secondary).setEmoji('🔗')
    );

    const backRow = getBackMenu('welcome');

    if (interaction && interaction.update) {
        await interaction.update({ embeds: [embed], components: [backRow, channelSelectRow, btnRow] });
    } else if (forceMessage) {
        await forceMessage.edit({ embeds: [embed], components: [backRow, channelSelectRow, btnRow] });
    }
}

function getBackMenu(current) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('social_select')
            .addOptions(
                { label: 'Alertas da Twitch', value: 'twitch', emoji: '👾', default: current === 'twitch' },
                { label: 'Boas-Vindas', value: 'welcome', emoji: '👋', default: current === 'welcome' }
            )
    );
}
