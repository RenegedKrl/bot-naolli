const { getData, saveData } = require('../../database');

// Taxas de drop e XP de cada raridade
const RARITIES = {
    '⚪ Comum':   { weight: 500, xp: 10,  color: '#b0b0b0' },
    '🟢 Incomum': { weight: 250, xp: 50,  color: '#32CD32' },
    '🔵 Rara':    { weight: 150, xp: 100, color: '#1E90FF' },
    '🟣 Épica':   { weight: 70,  xp: 250, color: '#8A2BE2' },
    '🟡 Lendária':{ weight: 30,  xp: 500, color: '#FFD700' }
};

function pickWeightedRarity() {
    const total = Object.values(RARITIES).reduce((s, r) => s + r.weight, 0);
    let rand = Math.random() * total;
    for (const [name, data] of Object.entries(RARITIES)) {
        if (rand < data.weight) return name;
        rand -= data.weight;
    }
    return '⚪ Comum';
}

// Sempre retorna imediatamente. Tenta buscar galeria do Jikan em background.
async function getCharacterSkin(anilistId, charName, defaultImageUrl) {
    // Resposta imediata garantida — usa imagem do Anilist com raridade sorteada
    const rarityName = pickWeightedRarity();
    const rarityData = RARITIES[rarityName];
    
    // Tenta enriquecer o cache em background (sem bloquear o roll)
    enrichCache(anilistId, charName, defaultImageUrl).catch(() => {});

    // Se já temos cache de skins, sorteia entre elas
    try {
        const skinsConfig = await getData('characterSkins.json') || {};
        if (skinsConfig[anilistId] && skinsConfig[anilistId].length > 0) {
            const skins = skinsConfig[anilistId];
            const total = skins.reduce((s, sk) => s + (RARITIES[sk.rarity]?.weight || 100), 0);
            let rand = Math.random() * total;
            for (const skin of skins) {
                const w = RARITIES[skin.rarity]?.weight || 100;
                if (rand < w) {
                    return {
                        url: skin.url,
                        rarity: skin.rarity,
                        xp: RARITIES[skin.rarity]?.xp || 10,
                        color: RARITIES[skin.rarity]?.color || '#b0b0b0'
                    };
                }
                rand -= w;
            }
        }
    } catch (_) {}

    return {
        url: defaultImageUrl,
        rarity: rarityName,
        xp: rarityData.xp,
        color: rarityData.color
    };
}

async function enrichCache(anilistId, charName, defaultImageUrl) {
    const skinsConfig = await getData('characterSkins.json') || {};
    if (skinsConfig[anilistId]) return; // já cacheado

    const fetchFn = typeof fetch !== 'undefined' ? fetch : (() => { throw new Error('no fetch'); });
    
    const searchRes = await fetchFn(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(charName)}&limit=1`);
    const searchData = await searchRes.json();
    if (!searchData.data || searchData.data.length === 0) return;

    const malId = searchData.data[0].mal_id;
    await new Promise(r => setTimeout(r, 400)); // respeita rate limit do Jikan
    
    const picsRes = await fetchFn(`https://api.jikan.moe/v4/characters/${malId}/pictures`);
    const picsData = await picsRes.json();

    const skins = [];
    if (picsData.data && picsData.data.length > 0) {
        for (const pic of picsData.data) {
            const imgUrl = pic.jpg?.image_url;
            if (imgUrl) skins.push({ url: imgUrl, rarity: pickWeightedRarity() });
        }
    }

    // Garante imagem padrão
    if (!skins.some(s => s.url === defaultImageUrl)) {
        skins.push({ url: defaultImageUrl, rarity: '⚪ Comum' });
    }

    skinsConfig[anilistId] = skins;
    await saveData('characterSkins.json', skinsConfig);
}

async function getAllCharacterSkins(anilistId, charName, defaultImageUrl) {
    let skinsConfig = await getData('characterSkins.json') || {};
    
    if (!skinsConfig[anilistId]) {
        await enrichCache(anilistId, charName, defaultImageUrl);
        skinsConfig = await getData('characterSkins.json') || {};
    }
    
    if (skinsConfig[anilistId] && skinsConfig[anilistId].length > 0) {
        return skinsConfig[anilistId];
    }
    
    return [{ url: defaultImageUrl, rarity: '⚪ Comum' }];
}

module.exports = { getCharacterSkin, getAllCharacterSkins, RARITIES };
