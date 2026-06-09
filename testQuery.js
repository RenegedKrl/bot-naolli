const query = `query {
    Page(page: 1, perPage: 50) {
        characters(sort: FAVOURITES_DESC) {
            id
            name { full }
            gender
            favorites
            image { large }
            media(sort: POPULARITY_DESC, perPage: 1) {
                nodes { title { romaji } }
            }
        }
    }
}`;

fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => console.error(e));
