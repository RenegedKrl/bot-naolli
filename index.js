require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const fs = require('fs');
const keepAlive = require('./keepAlive');
const { getData, saveData } = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.commands = new Collection();
const prefix = 'n!';

// ================= DISTUBE (MÚSICA) =================
client.distube = new DisTube(client, {
    ffmpeg: { path: require('ffmpeg-static') },
    plugins: [
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YtDlpPlugin({ update: true })
    ]
});

const status = queue =>
    `Volume: \`${queue.volume}%\` | Filtro: \`${queue.filters.names.join(', ') || 'Desativado'}\` | Loop: \`${
        queue.repeatMode ? (queue.repeatMode === 2 ? 'Fila Inteira' : 'Esta Música') : 'Desativado'
    }\` | Autoplay: \`${queue.autoplay ? 'Ligado' : 'Desligado'}\``

client.distube
    .on('playSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🎶 Tocando Agora')
            .setDescription(`[${song.name}](${song.url}) - \`${song.formattedDuration}\``)
            .addFields({ name: 'Status', value: status(queue) })
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Pedida por ${song.user.tag}`, iconURL: song.user.displayAvatarURL() });
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('addSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('✅ Adicionada à Fila')
            .setDescription(`[${song.name}](${song.url}) - \`${song.formattedDuration}\``)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Pedida por ${song.user.tag}` });
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('error', (error, queue, song) => {
        console.error('Distube error:', error);
        if (queue && queue.textChannel) {
            queue.textChannel.send(`❌ Ocorreu um erro: ${error.toString().slice(0, 1974)}`);
        }
    })
    .on('ffmpegDebug', (debug) => console.log('FFMPEG:', debug));

// ================= LER COMANDOS =================
const DISABLED_FOLDERS = ['music']; // Pastas desativadas (arquivos preservados)
const loadCommands = () => {
    const commandFolders = fs.readdirSync('./commands');
    for (const folder of commandFolders) {
        if (DISABLED_FOLDERS.includes(folder)) continue; // pula pastas desativadas
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            client.commands.set(command.name, command);
        }
    }
};
loadCommands();

// ================= EVENTOS DO BOT =================
client.once('clientReady', () => {
    console.log(`[Naolli] Logado com sucesso como ${client.user.tag}!`);
    client.user.setActivity('n!help | @Naolli', { type: ActivityType.Listening });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ================= AUTO-MODERAÇÃO =================
    if (message.guild && message.member && !message.member.permissions.has('ManageMessages')) {
        try {
            const automodConfig = await getData('automodConfig.json') || {};
            const cfg = automodConfig[message.guild.id];
            if (cfg) {
                const content = message.content.toLowerCase();
                const hasBlockedWord = cfg.words?.some(w => content.includes(w));
                const hasLink = cfg.antiLink && /https?:\/\/\S+/.test(content);

                if (hasBlockedWord || hasLink) {
                    await message.delete().catch(() => {});
                    const reason = hasBlockedWord ? 'palavra proibida' : 'link não permitido';
                    const warn = await message.channel.send(`⚠️ ${message.author}, sua mensagem foi removida (${reason}).`);
                    setTimeout(() => warn.delete().catch(() => {}), 5000);
                    if (cfg.warnChannel) {
                        const ch = message.guild.channels.cache.get(cfg.warnChannel);
                        ch?.send(`🚨 **AutoMod** | ${reason} detectado de <@${message.author.id}> em <#${message.channel.id}>\n> ${message.content.slice(0, 100)}`);
                    }
                    return;
                }
            }
        } catch (e) { console.error('AutoMod error:', e.message); }
    }

    // ================= SISTEMA DE NÍVEL / XP =================
    if (message.guild) {
        try {
            const allData = await getData('levelData.json');
            const guildId = message.guild.id;
            const userId = message.author.id;
            
            if (!allData[guildId]) allData[guildId] = {};
            if (!allData[guildId][userId]) allData[guildId][userId] = { xp: 0, level: 0 };
            
            const userData = allData[guildId][userId];
            const oldLevel = userData.level;
            
            if (oldLevel < 10) {
                userData.xp += 10; // 10 XP por mensagem (10 mensagens = 100 XP)
                
                const thresholds = [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
                const getXpReq = (lvl) => (lvl >= 10 ? Infinity : (thresholds[lvl] || Infinity));
                
                let newLevel = oldLevel;
                while (userData.xp >= getXpReq(newLevel) && newLevel < 10) {
                    newLevel++;
                }
                
                if (newLevel > oldLevel) {
                    userData.level = newLevel;
                    // Subiu de nível! Avisa no chat
                    message.channel.send(`🎉 Parabéns, <@${userId}>! Você atingiu o **Nível ${newLevel}**! 🏆`);
                    
                    // Verifica se tem cargo de recompensa
                    const levelConfig = await getData('levelConfig.json');
                    const guildRoles = levelConfig[guildId] || {};
                    
                    if (message.guild.members.me.permissions.has('ManageRoles')) {
                        // Remove cargos de níveis anteriores
                        for (let i = 1; i < newLevel; i++) {
                            const oldRoleId = guildRoles[i];
                            if (oldRoleId && message.member.roles.cache.has(oldRoleId)) {
                                await message.member.roles.remove(oldRoleId).catch(() => {});
                            }
                        }

                        // Adiciona o cargo novo
                        const newRoleId = guildRoles[newLevel];
                        if (newRoleId) {
                            const role = message.guild.roles.cache.get(newRoleId);
                            if (role) {
                                await message.member.roles.add(role).catch(() => {});
                            }
                        }
                    }
                } // <--- Faltou fechar o IF aqui
                
                // Salva em background sem travar o bot
                saveData('levelData.json', allData).catch(() => {});
            }
        } catch (e) {
            console.error('Erro no XP:', e);
        }
    }
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>( |)$`);
    if (message.content.match(mentionRegex)) {
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('✨ Olá! Sou a Naolli')
            .setDescription(`Meu prefixo é \`${prefix}\`.\nUse \`${prefix}help\` para ver tudo o que posso fazer!`);
        return message.reply({ embeds: [embed] });
    }

    const hasPrefix = message.content.startsWith(prefix);
    const mentionPrefixRegex = new RegExp(`^<@!?${client.user.id}> `);
    const isMention = mentionPrefixRegex.test(message.content);

    if (!hasPrefix && !isMention) return;

    let args;
    let commandName;

    if (hasPrefix) {
        args = message.content.slice(prefix.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    } else if (isMention) {
        const mentionText = message.content.match(mentionPrefixRegex)[0];
        args = message.content.slice(mentionText.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    }

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('❌ Ocorreu um erro ao tentar executar esse comando.');
    }
});

// ================= INTERACTION HANDLER (Reaction Roles, etc.) =================
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const guildId = interaction.guild?.id;
    const userId = interaction.user.id;

    // ---- REACTION ROLES ----
    if (interaction.customId.startsWith('rr_')) {
        try {
            const rrData = await getData('reactionRoles.json') || {};
            const msgRoles = rrData[guildId]?.[interaction.message.id];
            if (!msgRoles) return interaction.reply({ content: '❌ Painel desatualizado.', ephemeral: true });

            const roleId = msgRoles[interaction.customId];
            if (!roleId) return;

            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) return interaction.reply({ content: '❌ Cargo não encontrado.', ephemeral: true });

            const member = await interaction.guild.members.fetch(userId);
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                await interaction.reply({ content: `✅ Cargo **${role.name}** removido!`, ephemeral: true });
            } else {
                await member.roles.add(role);
                await interaction.reply({ content: `✅ Cargo **${role.name}** adicionado!`, ephemeral: true });
            }
        } catch (e) {
            console.error('ReactionRole error:', e.message);
            interaction.reply({ content: '❌ Erro ao gerenciar cargo.', ephemeral: true }).catch(() => {});
        }
        return;
    }
});

// ================= BOAS-VINDAS E AUTO-CARGO =================
client.on('guildMemberAdd', async member => {
    // ---- AUTO-CARGO ----
    try {
        const autoRoles = await getData('autoroleConfig.json');
        const roleId = autoRoles[member.guild.id]?.roleId;
        if (roleId) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && member.guild.members.me.permissions.has('ManageRoles')) {
                await member.roles.add(role).catch(() => {});
            }
        }
    } catch (e) { console.error('Erro no auto-cargo:', e); }

    // ---- BOAS-VINDAS ----
    const allConfig = await getData('welcomeConfig.json');
    let config = allConfig[member.guild.id];
    if (!config) return;

    if (typeof config === 'string') config = { channelId: config };
    if (!config.channelId) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    let desc = config.text || `Estamos muito felizes em ter você aqui no **{server}**!\n\nLeia as regras, interaja no chat e ouça umas músicas comigo!`;
    desc = desc.replace(/{user}/g, member.user.toString()).replace(/{server}/g, member.guild.name);

    const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(`🎉 Bem-vindo(a) ao servidor, ${member.user.username}!`)
        .setDescription(desc)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setImage('https://media.tenor.com/2s_T4p-yR5cAAAAC/anime-welcome.gif')
        .setFooter({ text: `Agora somos ${member.guild.memberCount} membros!` });

    const components = [];
    if (config.buttonUrl && config.buttonLabel) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(config.buttonLabel)
                .setURL(config.buttonUrl)
                .setStyle(ButtonStyle.Link)
        );
        components.push(row);
    }

    channel.send({ content: `${member.user}`, embeds: [embed], components: components.length ? components : undefined });
});

// ================= INTERACTION CREATE (SLASH COMMANDS) =================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        if (command.slashExecute) {
            await command.slashExecute(interaction);
        } else {
            // Conversor automático de Comandos Legados para Slash
            const argsString = interaction.options.getString('args') || '';
            const args = argsString.split(/ +/).filter(w => w);

            const fakeMessage = {
                author: interaction.user,
                member: interaction.member,
                guild: interaction.guild,
                channel: interaction.channel,
                client: client,
                createdTimestamp: interaction.createdTimestamp,
                content: `n!${command.name} ${argsString}`,
                mentions: {
                    users: { first: () => {
                        const match = argsString.match(/<@!?(\d+)>/);
                        if (match) return client.users.cache.get(match[1]);
                        return null;
                    }},
                    channels: { first: () => {
                        const match = argsString.match(/<#(\d+)>/);
                        if (match) return client.channels.cache.get(match[1]);
                        return null;
                    }}
                },
                reply: async (opt) => {
                    const payload = typeof opt === 'string' ? { content: opt, fetchReply: true } : { ...opt, fetchReply: true };
                    if (interaction.deferred || interaction.replied) return await interaction.followUp(payload);
                    return await interaction.reply(payload);
                },
                react: async () => {}, // mock pra não quebrar coisas que dão react na msg do usuario
            };

            await command.execute(fakeMessage, args, client);
        }
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Houve um erro ao executar este comando!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Houve um erro ao executar este comando!', ephemeral: true });
        }
    }
});

// ================= NOTIFICADOR TWITCH E YOUTUBE (AUTOMÁTICO SEM API KEYS) =================
const Parser = require('rss-parser');
const parser = new Parser();

setInterval(async () => {
    const allConfig = await getData('announcerConfig.json');
    let lastVideo = await getData('lastVideo.json');
    let liveStatus = await getData('liveStatus.json');

    for (const guildId in allConfig) {
        const config = allConfig[guildId];
        if (!config.channelId) continue;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;
        const channel = guild.channels.cache.get(config.channelId);
        if (!channel) continue;

        // YOUTUBE
        if (config.platform === 'youtube' && config.youtubeId) {
            try {
                const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${config.youtubeId}`);
                if (feed.items.length > 0) {
                    const latest = feed.items[0];
                    if (lastVideo[guildId] !== latest.id) {
                        const isFirstRun = !lastVideo[guildId];
                        lastVideo[guildId] = latest.id;
                        await saveData('lastVideo.json', lastVideo);

                        if (isFirstRun) continue;

                        let desc = config.text || `🚨 Tem vídeo novo no canal!`;
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle(latest.title)
                            .setURL(latest.link)
                            .setDescription(desc)
                            .setImage(`https://img.youtube.com/vi/${latest.id.replace('yt:video:', '')}/maxresdefault.jpg`)
                            .setFooter({ text: `YouTube • ${feed.title}` });

                        const components = [];
                        if (config.buttonLabel) {
                            const row = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setLabel(config.buttonLabel).setURL(latest.link).setStyle(ButtonStyle.Link)
                            );
                            components.push(row);
                        }
                        channel.send({ content: `@everyone`, embeds: [embed], components: components.length ? components : undefined });
                    }
                }
            } catch (e) { }
        }

        // TWITCH
        if (config.platform === 'twitch' && config.twitchId) {
            try {
                // Usa DecAPI (Proxy gratuito para Twitch) para ver se tá online
                const res = await fetch(`https://decapi.me/twitch/uptime/${config.twitchId}`);
                const text = await res.text();
                
                const isLive = !text.includes('offline') && !text.includes('not live') && !text.includes('not found');
                const wasLive = liveStatus[guildId] === true;

                if (isLive && !wasLive) {
                    liveStatus[guildId] = true;
                    await saveData('liveStatus.json', liveStatus);

                    const titleRes = await fetch(`https://decapi.me/twitch/title/${config.twitchId}`);
                    const title = await titleRes.text();
                    const gameRes = await fetch(`https://decapi.me/twitch/game/${config.twitchId}`);
                    const game = await gameRes.text();

                    let desc = config.text || `🚨 A live começou!`;
                    const embed = new EmbedBuilder()
                        .setColor('#9146FF')
                        .setTitle(`${config.twitchId} está ao vivo!`)
                        .setURL(`https://twitch.tv/${config.twitchId}`)
                        .setDescription(`**${title}**\n\n🎮 Jogando: ${game}\n\n${desc}`)
                        .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${config.twitchId}-1280x720.jpg?t=${Date.now()}`)
                        .setFooter({ text: `Twitch` });

                    const components = [];
                    if (config.buttonLabel) {
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setLabel(config.buttonLabel).setURL(`https://twitch.tv/${config.twitchId}`).setStyle(ButtonStyle.Link)
                        );
                        components.push(row);
                    }
                    channel.send({ content: `@everyone`, embeds: [embed], components: components.length ? components : undefined });
                } else if (!isLive && wasLive) {
                    liveStatus[guildId] = false;
                    await saveData('liveStatus.json', liveStatus);
                }
            } catch (e) { }
        }
    }
}, 60000); // Verifica a cada 1 minuto

// ================= ALERTAS CS2 (PANDASCORE + HLTV NEWS) =================
const PANDASCORE_TOKEN = process.env.PANDASCORE_TOKEN;
const TIER_MAP = { a: ['a'], b: ['a','b'], c: ['a','b','c'], d: ['a','b','c','d'], all: ['a','b','c','d','s'] };
const { sendMatchEmbed, sendNewsEmbed } = require('./csEmbeds');

async function psGet(game, endpoint) {
    const r = await fetch(`https://api.pandascore.co/${game}/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${PANDASCORE_TOKEN}` }
    });
    if (!r.ok) return [];
    const json = await r.json();
    return Array.isArray(json) ? json : [];
}

const GAMES_LIST = ['csgo', 'valorant', 'lol', 'ow'];

// Loop de verificação de Esports a cada 60s
setInterval(async () => {
    try {
        if (!PANDASCORE_TOKEN) return;

        let state = await getData('esportsState.json');
        if (!state.liveNotified) state.liveNotified = {};
        if (!state.resultNotified) state.resultNotified = {};
        if (!state.newsNotified) state.newsNotified = {};

        // Limpa notificações antigas (6h para resultados, 24h para resto)
        const now = Date.now();
        for (const id in state.resultNotified) if (now - state.resultNotified[id] > 21600000) delete state.resultNotified[id];
        for (const id in state.liveNotified) if (now - state.liveNotified[id] > 86400000) delete state.liveNotified[id];
        for (const key in state.newsNotified) if (now - state.newsNotified[key] > 86400000) delete state.newsNotified[key];

        for (const game of GAMES_LIST) {
            let matchConfig = {}, resultConfig = {}, newsConfig = {};
            
            // Carrega configs (CSGO usa arquivos legados para manter compatibilidade)
            if (game === 'csgo') {
                matchConfig = await getData('csMatchConfig.json');
                resultConfig = await getData('csResultConfig.json');
                newsConfig = await getData('csNewsConfig.json');
            } else {
                const config = await getData(`${game}Config.json`);
                for (const g in config) {
                    if (config[g].live) matchConfig[g] = { channelId: config[g].live };
                    if (config[g].result) resultConfig[g] = { channelId: config[g].result };
                    if (config[g].news) newsConfig[g] = { channelId: config[g].news };
                }
            }

            const hasMatchGuilds = Object.keys(matchConfig).length > 0;
            const hasResultGuilds = Object.keys(resultConfig).length > 0;
            const hasNewsGuilds = Object.keys(newsConfig).length > 0;

            if (!hasMatchGuilds && !hasResultGuilds && !hasNewsGuilds) continue;

            let liveMatches = [], pastMatches = [], newsItems = [];

            if (hasMatchGuilds) liveMatches = await psGet(game, 'matches/running?per_page=10&sort=begin_at');
            if (hasResultGuilds) pastMatches = await psGet(game, 'matches/past?sort=-modified_at&per_page=15');
            
            if (hasNewsGuilds) {
                try {
                    let rssUrl = null;
                    if (game === 'csgo') rssUrl = 'https://www.hltv.org/rss/news';
                    else if (game === 'valorant') rssUrl = 'https://www.vlr.gg/rss';

                    if (rssUrl) {
                        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
                        const json = await res.json();
                        if (json.status === 'ok' && json.items) newsItems = json.items.slice(0, 5);
                    }
                } catch(e) {}
            }

            // --- PARTIDAS AO VIVO ---
            for (const guildId in matchConfig) {
                const gConfig = matchConfig[guildId];
                if (!gConfig.channelId) continue;
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;
                const channel = guild.channels.cache.get(gConfig.channelId);
                if (!channel) continue;

                const allowedTiers = TIER_MAP[gConfig.tier || 'all'];
                for (const match of liveMatches) {
                    const tier = match.tournament?.tier || 'd';
                    if (gConfig.tier && gConfig.tier !== 'all' && !allowedTiers.includes(tier)) continue;
                    
                    const key = `${guildId}_${game}_${match.id}`;
                    if (state.liveNotified[key]) continue;
                    
                    await sendMatchEmbed(channel, match, 'live', game);
                    state.liveNotified[key] = Date.now();
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // --- RESULTADOS ---
            for (const guildId in resultConfig) {
                const gConfig = resultConfig[guildId];
                if (!gConfig.channelId) continue;
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;
                const channel = guild.channels.cache.get(gConfig.channelId);
                if (!channel) continue;

                const allowedTiers = TIER_MAP[gConfig.tier || 'all'];
                for (const match of pastMatches) {
                    if (!match.winner) continue;
                    const tier = match.tournament?.tier || 'd';
                    if (gConfig.tier && gConfig.tier !== 'all' && !allowedTiers.includes(tier)) continue;
                    
                    const key = `${guildId}_${game}_${match.id}`;
                    if (state.resultNotified[key]) continue;
                    
                    await sendMatchEmbed(channel, match, 'result', game);
                    state.resultNotified[key] = Date.now();
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // --- NOTÍCIAS ---
            for (const guildId in newsConfig) {
                const gConfig = newsConfig[guildId];
                if (!gConfig.channelId) continue;
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;
                const channel = guild.channels.cache.get(gConfig.channelId);
                if (!channel) continue;

                for (const item of newsItems) {
                    const newsKey = `${guildId}_${game}_${item.url || item.guid || item.link}`;
                    if (state.newsNotified[newsKey]) continue;
                    
                    await sendNewsEmbed(channel, item, game);
                    state.newsNotified[newsKey] = Date.now();
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        await saveData('esportsState.json', state);
    } catch (e) {
        console.error('[Esports Loop] Erro:', e.message);
    }
}, 60000);

keepAlive();
client.login(process.env.DISCORD_TOKEN);
