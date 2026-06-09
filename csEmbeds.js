const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

const STAR_TIER = { a: '⭐⭐⭐', b: '⭐⭐', c: '⭐', d: '', s: '🏆' };

const HLTV_ICON = 'https://www.hltv.org/img/static/favicon/favicon-32x32.png';

async function sendMatchEmbed(channel, match, type, game = 'csgo') {
    const opp = match.opponents || [];
    const team1 = opp[0]?.opponent;
    const team2 = opp[1]?.opponent;
    if (!team1 || !team2) return;

    const res = match.results || [];
    const score1 = res.find(r => r.team_id === team1.id)?.score ?? 0;
    const score2 = res.find(r => r.team_id === team2.id)?.score ?? 0;
    const format = match.number_of_games ? `MD${match.number_of_games}` : 'MD3';
    const event = match.league?.name || 'Partida de Esports';
    const flag1 = getFlagEmoji(team1.location);
    const flag2 = getFlagEmoji(team2.location);
    
    // Configurações por jogo
    let iconUrl = HLTV_ICON;
    let authorName = 'CS2 Esports';
    let matchUrl = `https://www.hltv.org/search?query=${encodeURIComponent((team1.name + ' ' + team2.name).replace(/ /g, '+'))}`;
    let colorLive = '#FF6B00';
    let colorResult = '#FFD700';

    if (game === 'valorant') {
        iconUrl = 'https://seeklogo.com/images/V/valorant-logo-FAB2CA0E55-seeklogo.com.png';
        authorName = 'Valorant Esports';
        matchUrl = `https://www.vlr.gg/search/?q=${encodeURIComponent(team1.name)}`;
        colorLive = '#FF4655'; colorResult = '#BD3944';
    } else if (game === 'lol') {
        iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg';
        authorName = 'LoL Esports';
        matchUrl = `https://lolesports.com/`;
        colorLive = '#C8AA6E'; colorResult = '#0AC8B9';
    } else if (game === 'ow') {
        iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/1/14/Overwatch_circle_logo.svg';
        authorName = 'Overwatch Esports';
        matchUrl = `https://overwatchleague.com/`;
        colorLive = '#F99E1A'; colorResult = '#CCCCCC';
    }

    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    const matchTimeUnix = Math.floor(new Date(match.begin_at || match.modified_at || Date.now()).getTime() / 1000);

    let embed;

    if (type === 'live') {
        embed = new EmbedBuilder()
            .setColor(colorLive)
            .setAuthor({ name: authorName, iconURL: iconUrl })
            .setTitle(`${flag1} ${team1.name} vs ${team2.name} ${flag2}`)
            .setURL(matchUrl)
            .setDescription(`🔴 Ao Vivo <t:${matchTimeUnix}:R>`)
            .addFields(
                { name: 'Evento', value: event, inline: true },
                { name: 'Formato', value: format, inline: true }
            )
            .setFooter({ text: `Hoje às ${timestamp.split(', ')[1]?.slice(0, 5) || timestamp}` });

    } else if (type === 'result') {
        const winner = match.winner;
        const winnerName = winner?.name || '?';
        const title = `${flag1} ${team1.name} [ ${score1} ] - [ ${score2} ] ${team2.name} ${flag2}`;

        embed = new EmbedBuilder()
            .setColor(colorResult)
            .setAuthor({ name: authorName, iconURL: iconUrl })
            .setTitle(title)
            .setURL(matchUrl)
            .setDescription(`🏆 **${winnerName}** venceu a partida`)
            .addFields(
                { name: 'Evento', value: event, inline: true },
                { name: 'Formato', value: format, inline: true }
            )
            .setFooter({ text: `Hoje às ${timestamp.split(', ')[1]?.slice(0, 5) || timestamp}` });
    }

    if (embed) {
        embed.addFields({ name: '\u200B', value: `[**Página da Partida**](${matchUrl})`, inline: false });
        await channel.send({ embeds: [embed] });
    }
}

async function translateText(text) {
    if (!text) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
        const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
        const res = await fetchFn(url);
        const json = await res.json();
        return json[0].map(item => item[0]).join('');
    } catch (e) {
        console.error('Erro na tradução:', e.message);
        return text;
    }
}

async function sendNewsEmbed(channel, item, game = 'csgo') {
    const HLTV_ICON = 'https://www.hltv.org/img/static/favicon/favicon-32x32.png';
    const STEAM_ICON = 'https://store.steampowered.com/favicon.ico';
    const VLR_ICON = 'https://seeklogo.com/images/V/valorant-logo-FAB2CA0E55-seeklogo.com.png';
    
    let iconUrl = HLTV_ICON;
    let authorName = 'HLTV.org News';
    let url = item.url || item.link || item.guid || 'https://www.hltv.org/news';
    let color = '#2B527D';

    if (item.url?.includes('steampowered')) {
        iconUrl = STEAM_ICON; authorName = 'Counter-Strike 2 — Steam News'; color = '#1B2838';
    } else if (game === 'valorant') {
        iconUrl = VLR_ICON; authorName = 'VLR.gg News'; color = '#BD3944';
    }
    let rawDescription = (item.description || item.contents || item.contentSnippet || '')
        .replace(/\\+/g, '\n')      // limpa escapes do Steam
        .replace(/\[.*?\]/g, '')    // remove tags [b], [img], etc
        .replace(/<[^>]*>?/gm, '')  // remove HTML tags (caso rss)
        .trim()
        .substring(0, 350);

    const title = item.title || 'CS2 News';
    
    // Traduz título e descrição
    const translatedTitle = await translateText(title);
    const translatedDesc = await translateText(rawDescription);

    // Converte data
    let dateUnix = Math.floor(Date.now() / 1000);
    if (item.date) {
        dateUnix = item.date;
    } else if (item.pubDate) {
        dateUnix = Math.floor(new Date(item.pubDate + ' UTC').getTime() / 1000);
    }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: authorName, iconURL: iconUrl })
        .setTitle(translatedTitle)
        .setURL(url)
        .setDescription(translatedDesc || '*Sem descrição disponível.*')
        .addFields({ name: '📅 Publicado', value: `<t:${dateUnix}:R>`, inline: true })
        .setFooter({ text: item.author ? `Por ${item.author}` : authorName });

    await channel.send({ embeds: [embed] });
}

module.exports = { sendMatchEmbed, sendNewsEmbed, STAR_TIER, getFlagEmoji };
