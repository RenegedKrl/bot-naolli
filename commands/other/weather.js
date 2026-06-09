const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'weather',
    aliases: ['clima', 'tempo'],
    async execute(message, args) {
        if (!args.length) return message.reply('⚠️ Diga uma cidade! (ex: `n!clima São Paulo`)');
        
        try {
            const city = encodeURIComponent(args.join(' '));
            const res = await fetch(`https://wttr.in/${city}?format=j1`);
            const data = await res.json();

            const current = data.current_condition[0];
            const location = data.nearest_area[0];

            const embed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setTitle(`🌦️ Clima em ${location.areaName[0].value}, ${location.country[0].value}`)
                .addFields(
                    { name: '🌡️ Temperatura', value: `${current.temp_C}°C (Sensação de ${current.FeelsLikeC}°C)`, inline: true },
                    { name: '💧 Umidade', value: `${current.humidity}%`, inline: true },
                    { name: '💨 Vento', value: `${current.windspeedKmph} km/h`, inline: true },
                    { name: '☁️ Condição', value: `${current.weatherDesc[0].value}`, inline: true }
                )
                .setFooter({ text: 'Informações via wttr.in' });
                
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Não encontrei essa cidade ou o serviço está indisponível.');
        }
    }
};
