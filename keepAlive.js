const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('O Bot Naolli está online e ativo!');
});

function keepAlive() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`[Sistema] Servidor Web de manutenção ativo na porta ${port}`);
    });
}

module.exports = keepAlive;
