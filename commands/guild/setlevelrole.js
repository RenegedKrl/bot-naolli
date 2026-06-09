const { getData, saveData } = require('../../database');

module.exports = {
    name: 'setlevelrole',
    aliases: ['levelrole', 'cargo-nivel'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor` para configurar os cargos de nível!');
        }

        if (args.length < 2 && args[0]?.toLowerCase() !== 'status') {
            return message.reply(
                '⚙️ **Configuração de Cargos por Nível:**\n\n' +
                '`n!setlevelrole <1 a 10> @Cargo` — define o cargo de recompensa para um nível\n' +
                '`n!setlevelrole <1 a 10> remove` — remove a recompensa de um nível\n' +
                '`n!setlevelrole status` — mostra todos os cargos configurados por nível'
            );
        }

        const config = await getData('levelConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = {};

        const action = args[0].toLowerCase();

        if (action === 'status') {
            let desc = '📈 **Cargos de Nível Configurados:**\n\n';
            for (let i = 1; i <= 10; i++) {
                const roleId = config[guildId][i];
                if (roleId) {
                    desc += `Nível ${i}: <@&${roleId}>\n`;
                } else {
                    desc += `Nível ${i}: *Sem cargo*\n`;
                }
            }
            return message.reply(desc);
        }

        const level = parseInt(action);
        if (isNaN(level) || level < 1 || level > 10) {
            return message.reply('⚠️ O nível deve ser um número de **1 a 10**!');
        }

        if (args[1].toLowerCase() === 'remove') {
            delete config[guildId][level];
            await saveData('levelConfig.json', config);
            return message.reply(`🗑️ A recompensa do Nível ${level} foi removida!`);
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.reply('⚠️ Você precisa mencionar um cargo válido (ex: `n!setlevelrole 2 @Membro Ativo`)!');
        }

        config[guildId][level] = role.id;
        await saveData('levelConfig.json', config);
        return message.reply(`✅ Feito! Quem alcançar o **Nível ${level}** receberá automaticamente o cargo **${role.name}**!`);
    }
};
