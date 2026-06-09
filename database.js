require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getData(fileName) {
    const { data, error } = await supabase
        .from('bot_data')
        .select('data')
        .eq('file_name', fileName)
        .single();
    
    if (error || !data) {
        return {};
    }
    return data.data;
}

async function saveData(fileName, jsonData) {
    const { error } = await supabase
        .from('bot_data')
        .upsert({ file_name: fileName, data: jsonData });
    
    if (error) {
        console.error(`[DB] Erro ao salvar ${fileName}:`, error);
    }
}

module.exports = { getData, saveData };
