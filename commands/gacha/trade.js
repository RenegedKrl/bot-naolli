const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getData, saveData } = require('../../database');

module.exports = {
    name: 'trade',
    aliases: ['trocar'],
    description: 'Inicia uma troca de personagens com outro usuário.',
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) return message.reply('⚠️ Você precisa mencionar o usuário com quem deseja trocar. Ex: `n!trade @usuario`');
        
        if (target.id === message.author.id) return message.reply('⚠️ Você não pode trocar com si mesmo.');
        if (target.bot) return message.reply('⚠️ Você não pode trocar com bots.');

        const config = await getData('gachaConfig.json');
        const guildId = message.guild.id;

        if (!config[guildId]) return message.reply('⚠️ Ninguém no servidor tem personagens ainda!');

        // Passo 1: Perguntar o que o autor quer dar
        const prompt1 = await message.reply('🔹 **Passo 1:** Digite o nome do SEU personagem que você quer dar na troca (ou digite `cancelar`):');

        const filterAuthor = m => m.author.id === message.author.id;
        
        try {
            const collected1 = await message.channel.awaitMessages({ filter: filterAuthor, max: 1, time: 60000, errors: ['time'] });
            const offerName = collected1.first().content.toLowerCase();
            
            if (offerName === 'cancelar') return message.reply('❌ Troca cancelada.');

            const userChars = Object.entries(config[guildId]).filter(([id, char]) => char.ownerId === message.author.id && char.name.toLowerCase().includes(offerName));

            if (userChars.length === 0) return message.reply(`❌ Você não possui nenhum personagem com o nome **${offerName}**.`);
            if (userChars.length > 1) return message.reply(`⚠️ Múltiplos personagens seus encontrados com esse nome. Seja mais específico.`);
            
            const [offerId, offerChar] = userChars[0];

            // Passo 2: Perguntar o que o autor quer receber
            const prompt2 = await message.reply(`🔹 **Passo 2:** Você ofereceu **${offerChar.name}**. Agora digite o nome do personagem do **${target.username}** que você quer receber (ou \`cancelar\`):`);

            const collected2 = await message.channel.awaitMessages({ filter: filterAuthor, max: 1, time: 60000, errors: ['time'] });
            const requestName = collected2.first().content.toLowerCase();

            if (requestName === 'cancelar') return message.reply('❌ Troca cancelada.');

            const targetChars = Object.entries(config[guildId]).filter(([id, char]) => char.ownerId === target.id && char.name.toLowerCase().includes(requestName));

            if (targetChars.length === 0) return message.reply(`❌ O usuário **${target.username}** não possui nenhum personagem com o nome **${requestName}**.`);
            if (targetChars.length > 1) return message.reply(`⚠️ Múltiplos personagens de ${target.username} encontrados com esse nome. Seja mais específico.`);

            const [requestId, requestChar] = targetChars[0];

            // Passo 3: Enviar proposta
            const embed = new EmbedBuilder()
                .setColor('#FF8C00')
                .setTitle('🔄 Proposta de Troca')
                .setDescription(`${target.toString()}, você recebeu uma proposta de troca de ${message.author.toString()}!`)
                .addFields(
                    { name: `O que ${message.author.username} dá:`, value: `**${offerChar.name}**`, inline: true },
                    { name: `O que ${target.username} dá:`, value: `**${requestChar.name}**`, inline: true }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept_trade')
                        .setLabel('Aceitar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('decline_trade')
                        .setLabel('Recusar')
                        .setStyle(ButtonStyle.Danger)
                );

            const tradeMsg = await message.reply({ content: target.toString(), embeds: [embed], components: [row] });

            const filterTarget = i => i.user.id === target.id;
            const collector = tradeMsg.createMessageComponentCollector({ filter: filterTarget, time: 120000 });

            collector.on('collect', async i => {
                if (i.customId === 'accept_trade') {
                    // Efetuar troca
                    // Re-verificar se ainda possuem os personagens (alguém pode ter dado/divorciado nesse meio tempo)
                    const latestConfig = await getData('gachaConfig.json');
                    if (latestConfig[guildId][offerId]?.ownerId !== message.author.id || latestConfig[guildId][requestId]?.ownerId !== target.id) {
                        return i.update({ content: '❌ A troca falhou pois um dos personagens não pertence mais ao dono original.', embeds: [], components: [] });
                    }

                    latestConfig[guildId][offerId].ownerId = target.id;
                    latestConfig[guildId][requestId].ownerId = message.author.id;
                    await saveData('gachaConfig.json', latestConfig);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Troca Concluída!')
                        .setDescription(`**${message.author.username}** recebeu **${requestChar.name}**\n**${target.username}** recebeu **${offerChar.name}**`);
                    
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'decline_trade') {
                    await i.update({ content: `❌ A troca foi recusada por ${target.username}.`, embeds: [], components: [] });
                }
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    tradeMsg.edit({ content: '⏳ O tempo para a troca expirou.', components: [] }).catch(() => {});
                }
            });

        } catch (e) {
            return message.reply('⏳ O tempo esgotou. Tente novamente.');
        }
    }
};
