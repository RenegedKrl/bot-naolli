const { EmbedBuilder } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'announcer',
    aliases: ['notificador', 'setannouncer'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor` para configurar o notificador!');
        }

        if (!args.length) {
            return message.reply(
                '⚠️ **Como configurar o Notificador (Automático a cada 60s):**\n\n' +
                '`n!announcer channel #canal` - Define onde as notificações vão aparecer\n' +
                '`n!announcer link <url>` - O Link do canal (ex: `https://twitch.tv/seu_canal` ou `https://youtube.com/@seu_canal`)\n' +
                '`n!announcer text <texto>` - Mensagem de notificação (Dica: coloque `@everyone`)\n' +
                '`n!announcer button <texto>` - Nome do botão (Ex: Assistir Agora)\n' +
                '`n!announcer test` - Confirma sua configuração\n' +
                '`n!announcer remove` - Para de notificar e apaga a configuração do bot'
            );
        }

        let config = await getData('announcerConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = {};

        const action = args[0].toLowerCase();

        if (action === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ Mencione um canal válido!');
            config[guildId].channelId = channel.id;
            message.reply(`✅ Notificações automáticas serão enviadas para ${channel}!`);
        } else if (action === 'link') {
            const link = args[1];
            if (!link || !link.startsWith('http')) return message.reply('⚠️ Forneça um link válido da Twitch ou YouTube!');
            
            if (link.includes('twitch.tv')) {
                const username = link.split('twitch.tv/')[1].split('/')[0].split('?')[0];
                config[guildId].twitchId = username;
                config[guildId].platform = 'twitch';
                message.reply(`✅ Bot conectado à Twitch! Monitorando a cada 60s o canal: **${username}**`);
            } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
                const msg = await message.reply('🔍 Lendo a página do YouTube para extrair as credenciais secretas...');
                try {
                    const res = await fetch(link);
                    const html = await res.text();
                    const match = html.match(/channel_id=([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        config[guildId].youtubeId = match[1];
                        config[guildId].platform = 'youtube';
                        msg.edit(`✅ Bot conectado ao YouTube! Monitorando o canal ID: **${match[1]}** a cada 60s.`);
                    } else {
                        msg.edit('❌ Não consegui ler esse link do YouTube automaticamente. Tente usar o link principal do canal.');
                        return;
                    }
                } catch (e) {
                    msg.edit('❌ Erro ao acessar o link.');
                    return;
                }
            } else {
                return message.reply('⚠️ Por enquanto suportamos links automáticos do YouTube e Twitch!');
            }
        } else if (action === 'text') {
            const text = args.slice(1).join(' ');
            if (!text) return message.reply('⚠️ Digite o texto!');
            config[guildId].text = text;
            message.reply(`✅ Texto atualizado!\n*(Prévia: ${text})*`);
        } else if (action === 'button') {
            const label = args.slice(1).join(' ');
            if (!label) return message.reply('⚠️ Formato incorreto!');
            config[guildId].buttonLabel = label;
            message.reply(`✅ Botão configurado com sucesso!`);
        } else if (action === 'test') {
            if (!config[guildId].channelId) return message.reply('⚠️ Você precisa configurar o canal primeiro! `n!announcer channel #canal`');
            
            const targetChannel = message.guild.channels.cache.get(config[guildId].channelId);
            if (!targetChannel) return message.reply('⚠️ Canal de envio não encontrado!');

            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            let embed, components = [];

            if (config[guildId].platform === 'twitch') {
                const desc = config[guildId].text || `🚨 A live começou!`;
                embed = new EmbedBuilder()
                    .setColor('#9146FF')
                    .setTitle(`[TESTE] ${config[guildId].twitchId} está ao vivo!`)
                    .setURL(`https://twitch.tv/${config[guildId].twitchId}`)
                    .setDescription(`**Super Live de Teste**\n\n🎮 Jogando: Just Chatting\n\n${desc}`)
                    .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${config[guildId].twitchId}-1280x720.jpg?t=${Date.now()}`)
                    .setFooter({ text: `Twitch` });

                if (config[guildId].buttonLabel) {
                    components.push(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel(config[guildId].buttonLabel).setURL(`https://twitch.tv/${config[guildId].twitchId}`).setStyle(ButtonStyle.Link)
                    ));
                }
            } else if (config[guildId].platform === 'youtube') {
                const desc = config[guildId].text || `🚨 Tem vídeo novo no canal!`;
                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('[TESTE] Novo Vídeo Incrível')
                    .setURL(`https://youtube.com/channel/${config[guildId].youtubeId}`)
                    .setDescription(desc)
                    .setFooter({ text: `YouTube` });

                if (config[guildId].buttonLabel) {
                    components.push(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel(config[guildId].buttonLabel).setURL(`https://youtube.com/channel/${config[guildId].youtubeId}`).setStyle(ButtonStyle.Link)
                    ));
                }
            } else {
                return message.reply('⚠️ Você precisa vincular um link do YouTube ou Twitch primeiro!');
            }

            targetChannel.send({ content: `**[MENSAGEM DE TESTE]**\n@everyone`, embeds: [embed], components: components.length ? components : undefined });
            return message.reply('✅ Teste enviado com sucesso lá no canal configurado!');
        } else if (action === 'remove' || action === 'stop') {
            if (!config[guildId]) return message.reply('⚠️ Você não tem nenhum notificador configurado!');
            delete config[guildId];
            message.reply('🗑️ Notificador removido com sucesso! O bot não vai mais enviar avisos automáticos neste servidor.');
        } else {
            return message.reply('⚠️ Ação inválida. Use `channel`, `link`, `text`, `button`, `test` ou `remove`.');
        }

        await saveData('announcerConfig.json', config);
    }
};
