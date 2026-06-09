const fetch = require('node-fetch');

async function test() {
    const query = `
    query { 
        Character(id: 40) { 
            id
            name { full }
            siteUrl
        } 
    }`;

    const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

test();
