// Global App States
let appMedicines = [];

// DOM Elements
const loadingEl = document.getElementById('loading');
const medicineGrid = document.getElementById('medicine-grid');
const totalExpenseEl = document.getElementById('total-expense');
const totalExerciseTimeEl = document.getElementById('total-exercise-time');

/* ==========================================================================
   1. Initialize App & Tab Navigation (Premium View Switching)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initCalendar();
    loadDashboardData();
});

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-item');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Active class များကို ဖယ်ရှားရန်
            document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
            
            // နှိပ်လိုက်သော Tab ကို Active လုပ်ရန်
            button.classList.add('active');
            const targetView = button.getAttribute('data-target');
            document.getElementById(targetView).classList.remove('hidden');
        });
    });
}

/* ==========================================================================
   2. Calendar Generator Widget 📆 (လန်းဆန်းသော တစ်ပတ်စာ နေ့ရက်များ)
   ========================================================================== */
function initCalendar() {
    const calendarStrip = document.getElementById('calendar-strip');
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    calendarStrip.innerHTML = '';
    
    // ယနေ့အပါအဝင် ရှေ့/နောက် ရက်အချို့ကို တွက်ချက်ပြသရန်
    for (let i = -3; i <= 3; i++) {
        const currentDay = new Date();
        currentDay.setDate(today.getDate() + i);
        
        const dayName = daysShort[currentDay.getDay()];
        const dateNum = currentDay.getDate();
        const isActive = i === 0 ? 'active' : ''; // ယနေ့ရက်ကို Highlight လုပ်ရန်
        
        const dayHtml = `
            <div class="calendar-day ${isActive}">
                <span>${dayName}</span>
                <span>${dateNum}</span>
            </div>
        `;
        calendarStrip.insertAdjacentHTML('beforeend', dayHtml);
    }
}

/* ==========================================================================
   3. Render & Control Medicines (Multi-Unit Handling: ဗူး/ကဒ်/လုံး)
   ========================================================================== */
async function loadDashboardData() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    // Supabase မှ Data ရယူခြင်း
    appMedicines = await dbFetchMedicines();
    
    if (loadingEl) loadingEl.classList.add('hidden');
    
    renderMedicines(appMedicines);
    calculateSummary();
}

function renderMedicines(medicines) {
    medicineGrid.innerHTML = '';
    
    if (medicines.length === 0) {
        medicineGrid.innerHTML = `<p class="loading-state">ဆေးစာရင်း မရှိသေးပါဗျာ။</p>`;
        return;
    }
    
    medicines.forEach(med => {
        // စုစုပေါင်း လက်ကျန် သုည ဖြစ်နေပါက ကတ်ပြားကို မှေးမှိန် (Out of stock) လုပ်ရန်
        const isOut = (med.box_count + med.card_count + med.unit_count) === 0;
        const cardClass = isOut ? 'med-card out-of-stock shadow-soft' : 'med-card shadow-soft';
        
        // Default Placeholder Img သုံးရန်၊ URL ရှိပါက ၎င်းကိုသုံးရန်
        const imgUrl = med.image_url || 'assets/images/placeholder.png';
        
        const cardHtml = `
            <div class="${cardClass}">
                <div class="med-img-wrapper">
                    <img src="${imgUrl}" alt="${med.name}">
                </div>
                
                <div class="med-info">
                    <h2>${med.name}</h2>
                    <p class="med-brand">${med.brand || 'General'}</p>
                    
                    <div class="units-container">
                        <span class="unit-badge">📦 ဗူး: ${med.box_count || 0}</span>
                        <span class="unit-badge">🃏 ကဒ်: ${med.card_count || 0}</span>
                        <span class="unit-badge">💊 လုံး: ${med.unit_count || 0}</span>
                    </div>
                </div>
                
                <div class="controls-wrapper">
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'box_count', ${med.box_count || 0}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">ဗူး</span>
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'box_count', ${med.box_count || 0}, 1)">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'card_count', ${med.card_count || 0}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">ကဒ်</span>
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'card_count', ${med.card_count || 0}, 1)">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'unit_count', ${med.unit_count || 0}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">လုံး</span>
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'unit_count', ${med.unit_count || 0}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
        medicineGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// ခလုတ်နှိပ်လိုက်လျှင် ဒေတာဘေ့စ်တွင် သွားရောက်တိုး/လျှော့ပေးမည့် ပင်မလုပ်ဆောင်ချက်
async function changeStock(id, field, currentVal, step) {
    const newVal = currentVal + step;
    const success = await dbUpdateStock(id, field, newVal);
    if (success) {
        // ဒေတာကို ပြန်လည်မောင်းနှင်ပြသခြင်း
        loadDashboardData();
    }
}

/* ==========================================================================
   4. Calculations & Summaries (ငွေပမာဏ 💰 နှင့် မိနစ် ⏱️ စုစုပေါင်းတွက်ချက်ခြင်း)
   ========================================================================== */
function calculateSummary() {
    // ဤနေရာတွင် လက်ရှိနေ့အလိုက် စုစုပေါင်း ကုန်ကျစရိတ်နှင့် လေ့ကျင့်ခန်းမိနစ်ကို Dynamic တွက်ချက်ပြသနိုင်ပါသည်
    // နမူနာအနေဖြင့် အသေပြသထားခြင်းဖြစ်ပြီး၊ Database မှတစ်ဆင့် Sum လုပ်နိုင်ပါသည်
    totalExpenseEl.innerText = "၄၅,၀၀၀"; 
    totalExerciseTimeEl.innerText = "၃၅";
}