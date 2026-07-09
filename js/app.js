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
            const viewElement = document.getElementById(targetView);
            if (viewElement) {
                viewElement.classList.remove('hidden');
            }
        });
    });
}

/* ==========================================================================
   2. Calendar Generator Widget 📆 (လန်းဆန်းသော တစ်ပတ်စာ နေ့ရက်များ)
   ========================================================================== */
function initCalendar() {
    const calendarStrip = document.getElementById('calendar-strip');
    if (!calendarStrip) return;
    
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    calendarStrip.innerHTML = '';
    
    // ယနေ့အပါအဝင် ရှေ့ ၃ ရက်၊ နောက် ၃ ရက်ကို တွက်ချက်ပြသရန်
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
    
    try {
        // Supabase မှ Data ရယူခြင်း (dbFetchMedicines ဖိုင်သည် supabase-db.js ထဲမှဖြစ်သည်)
        if (typeof dbFetchMedicines === 'function') {
            appMedicines = await dbFetchMedicines();
        } else {
            console.error("dbFetchMedicines function မရှိသေးပါ");
            appMedicines = [];
        }
    } catch (error) {
        console.error("Data loading error:", error);
        appMedicines = [];
    }
    
    if (loadingEl) loadingEl.classList.add('hidden');
    
    renderMedicines(appMedicines);
    calculateSummary();
}

function renderMedicines(medicines) {
    if (!medicineGrid) return;
    medicineGrid.innerHTML = '';
    
    if (!medicines || medicines.length === 0) {
        medicineGrid.innerHTML = `<p class="loading-state">ဆေးစာရင်း မရှိသေးပါဗျာ။ (Supabase ထဲတွင် row ထည့်ပေးရန် လိုအပ်ပါသည်)</p>`;
        return;
    }
    
    medicines.forEach(med => {
        // လက်ကျန် သုည ဖြစ်နေပါက ကတ်ပြားကို မှေးမှိန် (Out of stock) လုပ်ရန်
        const box = med.box_count || 0;
        const card = med.card_count || 0;
        const unit = med.unit_count || 0;
        const isOut = (box + card + unit) === 0;
        const cardClass = isOut ? 'med-card out-of-stock shadow-soft' : 'med-card shadow-soft'; /* */
        
        // Placeholder Img သုံးရန်၊ URL ရှိပါက ၎င်းကိုသုံးရန်
        const imgUrl = med.image_url || 'assets/images/placeholder.png';
        
        const cardHtml = `
            <div class="${cardClass}">
                <div class="med-img-wrapper">
                    <img src="${imgUrl}" alt="${med.name}" onerror="this.src='assets/images/placeholder.png'">
                </div>
                
                <div class="med-info">
                    <h2>${med.name}</h2>
                    <p class="med-brand">${med.brand || 'General'}</p>
                    
                    <div class="units-container">
                        <span class="unit-badge">📦 ဗူး: ${box}</span>
                        <span class="unit-badge">🃏 ကဒ်: ${card}</span>
                        <span class="unit-badge">💊 လုံး: ${unit}</span>
                    </div>
                </div>
                
                <div class="controls-wrapper">
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'box_count', ${box}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">ဗူး</span>
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'box_count', ${box}, 1)">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'card_count', ${card}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">ကဒ်</span>
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'card_count', ${card}, 1)">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'unit_count', ${unit}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">လုံး</span>
                        <button class="btn-ctrl" onclick="changeStock(${med.id}, 'unit_count', ${unit}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
        medicineGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// ခလုတ်နှိပ်လျှင် ဒေတာဘေ့စ်တွင် သွားရောက်တိုး/လျှော့ပေးမည့် ပင်မလုပ်ဆောင်ချက်
async function changeStock(id, field, currentVal, step) {
    if (typeof dbUpdateStock === 'function') {
        const newVal = currentVal + step;
        const success = await dbUpdateStock(id, field, newVal);
        if (success) {
            loadDashboardData();
        }
    }
}

/* ==========================================================================
   4. Calculations & Summaries (Dashboard အနှစ်ချုပ် တွက်ချက်ခြင်း)
   ========================================================================== */
function calculateSummary() {
    // Safety check: Element များ ရှိမရှိ စစ်ဆေးပြီးမှ တန်ဖိုးထည့်ရန်
    if (totalExpenseEl) totalExpenseEl.innerText = "0"; 
    if (totalExerciseTimeEl) totalExerciseTimeEl.innerText = "0";
}
