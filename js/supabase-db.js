// 💡 FIX: CDN မှ ပါဝင်လာသော 'supabase' Global Object ကို သေချာစွာ ညွှန်းဆိုပြီး Client တည်ဆောက်ခြင်း
const { createClient } = window.supabase || {};
const supabaseClient = createClient ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!supabaseClient) {
    console.error("Supabase SDK ကို ချိတ်ဆက်၍ မရပါသဖြင့်။ index.html ရှိ CDN ကို ပြန်စစ်ပါ။");
}

/**
 * 1. ဆေးဝါးများအားလုံးကို ဆွဲယူခြင်း (Read)
 */
async function dbFetchMedicines() {
    if (!supabaseClient) return [];
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
        console.error("Network Error during fetch:", err);
        return [];
    }
}

/**
 * 2. ဆေးအရေအတွက် (ဗူး/ကဒ်/လုံး) ကို Update လုပ်ခြင်း (Update)
 */
async function dbUpdateStock(id, field, newValue) {
    if (!supabaseClient || newValue < 0) return false;
    
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
        console.error("Network Error during update:", err);
        return false;
    }
}

/**
 * 3. ကျန်းမာရေး/ဆေးခန်း မှတ်တမ်းများ ဆွဲယူခြင်း (Read Logs)
 */
async function dbFetchHealthLogs(type) {
    if (!supabaseClient) return [];
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
        console.error("Network Error during fetching logs:", err);
        return [];
    }
}
