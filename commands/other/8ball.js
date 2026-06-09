const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: '8ball',
    aliases: ['pergunta', 'magica'],
    async execute(message, args) {
        if (!args.length) return message.reply('🎱 Você precisa me fazer uma pergunta! (ex: `n!8ball o flamengo vai ganhar?`)');
        const respostas = [
            'Sim, com certeza!', 'É decidido que sim.', 'Sem dúvida.', 'Sim, definitivamente.', 'Você pode contar com isso.',
            'A meu ver, sim.', 'Mais provável.', 'Tudo aponta que sim.', 'Sim.', 'Os sinais apontam que sim.',
            'A resposta é nebulosa, tente de novo.', 'Pergunte novamente mais tarde.', 'Melhor não te contar agora.',
            'Não é possível prever agora.', 'Concentre-se e pergunte de novo.',
            'Não conte com isso.', 'Minha resposta é não.', 'Minhas fontes dizem não.', 'Parece que não.', 'Muito duvidoso.'
        ];
        const resposta = respostas[Math.floor(Math.random() * respostas.length)];
        
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🎱 A Bola Mágica Responde...')
            .addFields(
                { name: 'Sua Pergunta', value: args.join(' ') },
                { name: 'Minha Resposta', value: resposta }
            );
        message.reply({ embeds: [embed] });
    }
};
