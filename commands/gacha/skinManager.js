const { getData, saveData } = require('../../database');

// Taxas de drop e XP de cada raridade
const RARITIES = {
    '⚪ Comum': { weight: 500, xp: 10, color: '#FFFFFF' },
    '🟢 Incomum': { weight: 250, xp: 50, color: '#32CD32' },
    '🔵 Rara': { weight: 150, xp: 100, color: '#1E90FF' },
    '🟣 Épica': { weight: 70, xp: 250, color: '#8A2BE2' },
    '🟡 Lendária': { weight: 30, xp: 500, color: '#FFD700' }
};

// Sorteia uma raridade baseada nos pesos
function getRandomRarity() {
    let totalWeight = Object.values(RARITIES).reduce((acc, r) => acc + r.weight, 0);
    let randomNum = Math.random() * totalWeight;
    
    for (const [rarityName, rarityData] of Object.entries(RARITIES)) {
        if (randomNum < rarityData.weight) {
            return { name: rarityName, ...rarityData };
        }
        randomNum -= rarityData.weight;
    }
    return { name: '⚪ Comum', ...RARITIES['⚪ Comum'] };
}

// Retorna uma skin aleatória para o personagem (com cache e fetch na Jikan)
async function getCharacterSkin(anilistId, charName, defaultImageUrl) {
    let skinsConfig = await getData('characterSkins.json');
    if (!skinsConfig) skinsConfig = {};

    // Se já temos a galeria do personagem cacheada
    if (!skinsConfig[anilistId]) {
        skinsConfig[anilistId] = [];
        
        try {
            const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
            // 1. Buscar o ID do MAL
            const malSearchRes = await fetchFn(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(charName)}&limit=1`);
            const malSearchData = await malSearchRes.json();
            
            if (malSearchData.data && malSearchData.data.length > 0) {
                const malId = malSearchData.data[0].mal_id;
                
                // 2. Buscar as imagens
                const malPicsRes = await fetchFn(`https://api.jikan.moe/v4/characters/${malId}/pictures`);
                const malPicsData = await malPicsRes.json();
                
                if (malPicsData.data && malPicsData.data.length > 0) {
                    for (const pic of malPicsData.data) {
                        const imgUrl = pic.jpg.image_url;
                        if (imgUrl) {
                            skinsConfig[anilistId].push({
                                url: imgUrl,
                                rarity: getRandomRarity().name
                            });
                        }
                    }
                }
            }
            
            // Garantir que a imagem padrão do Anilist esteja sempre na lista, pelo menos como Comum
            if (skinsConfig[anilistId].length === 0) {
                skinsConfig[anilistId].push({ url: defaultImageUrl, rarity: '⚪ Comum' });
            } else {
                // Se o defaultImageUrl não estiver na lista, adiciona como comum
                const hasDefault = skinsConfig[anilistId].some(s => s.url === defaultImageUrl);
                if (!hasDefault) {
                    skinsConfig[anilistId].push({ url: defaultImageUrl, rarity: '⚪ Comum' });
                }
            }
            
            // Salvar no banco
            await saveData('characterSkins.json', skinsConfig);
        } catch (e) {
            console.error('Erro ao buscar skins no Jikan:', e);
            return { url: defaultImageUrl, rarity: '⚪ Comum', ...RARITIES['⚪ Comum'] };
        }
    }

    const availableSkins = skinsConfig[anilistId];
    
    // Sortear qual skin vai vir agora, baseado nas raridades que existem na lista
    // Precisamos fazer um sorteio ponderado de novo, mas apenas entre as skins que o personagem possui!
    
    let totalSkinsWeight = 0;
    for (const skin of availableSkins) {
        totalSkinsWeight += RARITIES[skin.rarity].weight;
    }
    
    let randomNum = Math.random() * totalSkinsWeight;
    let selectedSkin = availableSkins[0];
    
    for (const skin of availableSkins) {
        const weight = RARITIES[skin.rarity].weight;
        if (randomNum < weight) {
            selectedSkin = skin;
            break;
        }
        randomNum -= weight;
    }

    return {
        url: selectedSkin.url,
        rarity: selectedSkin.rarity,
        xp: RARITIES[selectedSkin.rarity].xp,
        color: RARITIES[selectedSkin.rarity].color
    };
}

module.exports = { getCharacterSkin, RARITIES };
