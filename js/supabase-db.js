// 💡 FIX: Variable နာမည်ကို 'dbClient' သို့မဟုတ် Library နာမည်အကြီး 'supabase.createClient' ပုံစံအတိုင်း တိကျအောင် ပြင်ဆင်ထားပါသည်။
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 1. ဆေးဝါးများအားလုံးကို ဆွဲယူခြင်း
 */
async function dbFetchMedicines() {
    try {
        let { data, error } = await supabaseClient
            .from('medicines')
            .select('*')
            .order('name', { ascending: true });
            
        if (error) {
            console.error("Fetch Error:", error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error("Network Error:", err);
        return [];
    }
}

/**
 * 2. ဆေးအရေအတွက် (ဗူး/ကဒ်/လုံး) ကို Update လုပ်ခြင်း
 */
async function dbUpdateStock(id, field, newValue) {
    if (newValue < 0) return false; // သုညအောက် လျှော့မရအောင် တားဆီးခြင်း
    
    try {
        let { error } = await supabaseClient
            .from('medicines')
            .update({ [field]: newValue })
            .eq('id', id);
            
        if (error) {
            console.error("Update Error:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Network Update Error:", err);
        return false;
    }
}

/**
 * 3. ယနေ့ ကျန်းမာရေး/ဆေးခန်း မှတ်တမ်းများ ဆွဲယူခြင်း
 */
async function dbFetchHealthLogs(type) {
    // type parameter တွင် 'exercises' သို့မဟုတ် 'clinic_visits' ကို ထည့်သွင်းရမည်
    try {
        let { data, error } = await supabaseClient
            .from(type)
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Fetch Logs Error:", error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error("Network Logs Error:", err);
        return [];
    }
}
