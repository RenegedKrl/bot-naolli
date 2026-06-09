const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command) {
            commands.push(command.data.toJSON());
        } else {
            // Gera um Slash Command genérico para todos os outros comandos
            const data = new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.description || `Executa o comando ${command.name}`)
                .addStringOption(option => 
                    option.setName('args')
                        .setDescription('Argumentos opcionais para o comando (como nome de música, link, etc)')
                        .setRequired(false));
            commands.push(data.toJSON());
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`[SLASH COMMANDS] Iniciando atualização de ${commands.length} slash commands...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`[SLASH COMMANDS] Sucesso! ${data.length} comandos foram carregados no Discord.`);
    } catch (error) {
        console.error(error);
    }
})();
