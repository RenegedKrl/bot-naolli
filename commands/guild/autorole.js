const { getData, saveData } = require('../../database');

module.exports = {
    name: 'autorole',
    aliases: ['auto-cargo', 'setautorole', 'autocargo'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Você precisa da permissão de `Gerenciar Servidor` para configurar o auto-cargo!');
        }

        if (!args.length) {
            return message.reply(
                '🤖 **Configuração de Auto-Cargo:**\n\n' +
                '`n!autorole @Cargo` — define o cargo que será dado aos novos membros\n' +
                '`n!autorole status` — mostra o cargo configurado atualmente\n' +
                '`n!autorole remove` — desativa o sistema de auto-cargo'
            );
        }

        const config = await getData('autoroleConfig.json');
        const guildId = message.guild.id;
        if (!config[guildId]) config[guildId] = {};

        const action = args[0].toLowerCase();

        if (action === 'remove') {
            delete config[guildId];
            await saveData('autoroleConfig.json', config);
            return message.reply('🗑️ O sistema de auto-cargo foi **desativado** neste servidor!');

        } else if (action === 'status') {
            const roleId = config[guildId]?.roleId;
            const role = roleId ? message.guild.roles.cache.get(roleId) : null;
            if (role) {
                return message.reply(`✅ O auto-cargo atual é: **${role.name}**`);
            } else {
                return message.reply('❌ Nenhum auto-cargo configurado. Use `n!autorole @Cargo`.');
            }

        } else {
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
            if (!role) {
                return message.reply('⚠️ Você precisa mencionar um cargo válido (ex: `n!autorole @Membros`)!');
            }

            // Verifica se o bot tem permissão de gerenciar cargos e se o cargo do bot é maior que o cargo alvo
            if (!message.guild.members.me.permissions.has('ManageRoles')) {
                return message.reply('❌ Eu preciso da permissão de `Gerenciar Cargos` no servidor para dar cargos!');
            }

            if (message.guild.members.me.roles.highest.position <= role.position) {
                return message.reply('⚠️ Meu cargo precisa estar **acima** do cargo mencionado na lista de cargos do Discord para eu conseguir entregar ele aos membros!');
            }

            config[guildId].roleId = role.id;
            await saveData('autoroleConfig.json', config);
            return message.reply(`✅ Sistema ativado! Agora todos os novos membros receberão o cargo **${role.name}** automaticamente!`);
        }
    }
};
