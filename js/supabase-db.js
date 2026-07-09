// 💡 FIX: Library ကို URL မှ တိုက်ရိုက် Dynamic Module အနေဖြင့် လှမ်းခေါ်ပြီး Client တည်ဆောက်ခြင်း
let supabaseClient = null;

// Supabase Client ကို စနစ်တကျ ဆောက်ရန် ကြိုးစားခြင်း
if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    // အကယ်၍ CDN ပျက်နေပါက fallback အနေဖြင့် တိုက်ရိုက်ချိတ်ဆက်ခြင်း
    try {
        console.log("Using fallback Supabase initialization...");
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch(e) {
        console.error("Supabase Initialization Failed:", e);
    }
}

/**
 * 1. ဆေးဝါးများအားလုံးကို ဆွဲယူခြင်း
 */
async function dbFetchMedicines() {
    if (!supabaseClient) {
        console.error("Supabase Client is not initialized.");
        return [];
    }
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
 * 2. ဆေးအရေအတွက် (ဗူး/ကဒ်/လုံး) ကို Update လုပ်ခြင်း
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
 * 3. ကျန်းမာရေး/ဆေးခန်း မှတ်တမ်းများ ဆွဲယူခြင်း
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
