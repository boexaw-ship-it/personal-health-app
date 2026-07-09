// Initialize Supabase Client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. ဆေးဝါးများအားလုံးကို ဆွဲယူခြင်း
async function dbFetchMedicines() {
    let { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name', { ascending: true });
    if (error) console.error("Fetch Error:", error);
    return data || [];
}

// 2. ဆေးအရေအတွက် (ဗူး/ကဒ်/လုံး) ကို Update လုပ်ခြင်း
async function dbUpdateStock(id, field, newValue) {
    if (newValue < 0) return false;
    let { error } = await supabase
        .from('medicines')
        .update({ [field]: newValue })
        .eq('id', id);
    if (error) {
        console.error("Update Error:", error);
        return false;
    }
    return true;
}

// 3. ယနေ့ ကျန်းမာရေး/ဆေးခန်း မှတ်တမ်းများ ဆွဲယူခြင်း
async function dbFetchHealthLogs(type) {
    // type: 'exercises' သို့မဟုတ် 'clinic_visits'
    let { data, error } = await supabase
        .from(type)
        .select('*')
        .order('created_at', { ascending: false });
    if (error) console.error("Fetch Logs Error:", error);
    return data || [];
}
