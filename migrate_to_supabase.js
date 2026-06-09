require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const filesToMigrate = [
    'gachaConfig.json',
    'gachaLimits.json',
    'welcomeConfig.json',
    'announcerConfig.json',
    'djConfig.json',
    'lastVideo.json',
    'liveStatus.json'
];

async function migrate() {
    console.log('Iniciando migração para o Supabase...');
    for (const file of filesToMigrate) {
        if (fs.existsSync(file)) {
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                const { error } = await supabase
                    .from('bot_data')
                    .upsert({ file_name: file, data: data });
                
                if (error) {
                    console.error(`[Erro] Falha ao migrar ${file}:`, error);
                } else {
                    console.log(`[Sucesso] ${file} migrado com sucesso!`);
                }
            } catch (e) {
                console.error(`[Erro] Lendo arquivo ${file}:`, e);
            }
        } else {
            console.log(`[Aviso] Arquivo ${file} não encontrado localmente (será criado vazio no banco sob demanda).`);
        }
    }
    console.log('Migração concluída!');
}

migrate();
