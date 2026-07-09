// Global Client Variable
let supabaseClient = null;

/**
 * 💡 FIX: Library အသင့်ဖြစ်မှ Client ကို ဆောက်ပေးမည့် စနစ်
 */
function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    
    // window.supabase ရှိမရှိ သေချာစွာ စစ်ဆေးခြင်း
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client အောင်မြင်စွာ တည်ဆောက်ပြီးပါပြီ။");
        return supabaseClient;
    }
    
    console.error("Supabase Library မတက်လာသေးပါ။ index.html ရှိ CDN ကို စစ်ဆေးပါ");
    return null;
}

/**
 * 1. ဆေးဝါးများအားလုံးကို ဆွဲယူခြင်း
 */
async function dbFetchMedicines() {
    const client = getSupabaseClient();
    if (!client) return [];
    
    try {
        let { data, error } = await client
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
    const client = getSupabaseClient();
    if (!client || newValue < 0) return false;
    
    try {
        let { error } = await client
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
    const client = getSupabaseClient();
    if (!client) return [];
    
    try {
        let { data, error } = await client
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
