// Global App States
let appMedicines = [];

// DOM Elements
const loadingEl = document.getElementById('loading');
const medicineGrid = document.getElementById('medicine-grid');
const totalExpenseEl = document.getElementById('total-expense');
const totalExerciseTimeEl = document.getElementById('total-exercise-time');

// 🏃 Health Log DOM Elements
const exerciseList = document.getElementById('exercise-list');
const clinicList = document.getElementById('clinic-list');
const btnAddExercise = document.getElementById('btn-add-exercise');
const btnAddClinic = document.getElementById('btn-add-clinic');

/* ==========================================================================
   1. Initialize App & Tab Navigation
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initCalendar();
    loadDashboardData();
    initLogButtons(); // ခလုတ်များ အလုပ်လုပ်ရန် စတင်နှိုးဆော်ခြင်း
});

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-item');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
            
            button.classList.add('active');
            const targetView = button.getAttribute('data-target');
            const viewElement = document.getElementById(targetView);
            if (viewElement) viewElement.classList.remove('hidden');
        });
    });
}

/* ==========================================================================
   2. Calendar Generator Widget 📆
   ========================================================================== */
function initCalendar() {
    const calendarStrip = document.getElementById('calendar-strip');
    if (!calendarStrip) return;
    
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    calendarStrip.innerHTML = '';
    
    for (let i = -3; i <= 3; i++) {
        const currentDay = new Date();
        currentDay.setDate(today.getDate() + i);
        const dayName = daysShort[currentDay.getDay()];
        const dateNum = currentDay.getDate();
        const isActive = i === 0 ? 'active' : '';
        
        const dayHtml = `<div class="calendar-day ${isActive}"><span>${dayName}</span><span>${dateNum}</span></div>`;
        calendarStrip.insertAdjacentHTML('beforeend', dayHtml);
    }
}

/* ==========================================================================
   3. Render & Control Medicines (ဗူး/ကဒ်/လုံး)
   ========================================================================== */
async function loadDashboardData() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    try {
        if (typeof dbFetchMedicines === 'function') {
            appMedicines = await dbFetchMedicines();
        }
        
        // ကျန်းမာရေး မှတ်တမ်းများကိုပါ တစ်ခါတည်း ဆွဲယူရန်
        if (typeof dbFetchHealthLogs === 'function') {
            const exercises = await dbFetchHealthLogs('exercises');
            const clinicVisits = await dbFetchHealthLogs('clinic_visits');
            renderHealthLogs(exercises, 'exercises');
            renderHealthLogs(clinicVisits, 'clinic_visits');
            calculateSummary(exercises, clinicVisits);
        }
    } catch (error) {
        console.error("Data loading error:", error);
    }
    
    if (loadingEl) loadingEl.classList.add('hidden');
    renderMedicines(appMedicines);
}

function renderMedicines(medicines) {
    if (!medicineGrid) return;
    medicineGrid.innerHTML = '';
    
    if (!medicines || medicines.length === 0) {
        medicineGrid.innerHTML = `<p class="loading-state">ဆေးစာရင်း မရှိသေးပါဗျာ။ (Supabase ထဲတွင် row ရှိသော်လည်း မပေါ်ပါက config.js အား ပြန်စစ်ပါ)</p>`;
        return;
    }
    
    medicines.forEach(med => {
        const medName = med.name || 'Unknown Medicine';
        const medBrand = med.brand || 'General';
        const medId = med.id || 0;
        
        const box = med.box_count || 0;
        const card = med.card_count || 0;
        const unit = med.unit_count || 0;
        const isOut = (box + card + unit) === 0;
        const cardClass = isOut ? 'med-card out-of-stock shadow-soft' : 'med-card shadow-soft';
        const imgUrl = med.image_url || 'assets/images/placeholder.png';
        
        const cardHtml = `
            <div class="${cardClass}">
                <div class="med-img-wrapper">
                    <img src="${imgUrl}" alt="${medName}" onerror="this.src='assets/images/placeholder.png'">
                </div>
                
                <div class="med-info">
                    <h2>${medName}</h2>
                    <p class="med-brand">${medBrand}</p>
                    
                    <div class="units-container">
                        <span class="unit-badge">📦 ဗူး: ${box}</span>
                        <span class="unit-badge">🃏 ကဒ်: ${card}</span>
                        <span class="unit-badge">💊 လုံး: ${unit}</span>
                    </div>
                </div>
                
                <div class="controls-wrapper">
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${medId}, 'box_count', ${box}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">ဗူး</span>
                        <button class="btn-ctrl" onclick="changeStock(${medId}, 'box_count', ${box}, 1)">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${medId}, 'card_count', ${card}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">ကဒ်</span>
                        <button class="btn-ctrl" onclick="changeStock(${medId}, 'card_count', ${card}, 1)">+</button>
                    </div>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <button class="btn-ctrl" onclick="changeStock(${medId}, 'unit_count', ${unit}, -1)">-</button>
                        <span style="font-size:0.75rem; font-weight:600; width:30px; text-align:center;">လုံး</span>
                        <button class="btn-ctrl" onclick="changeStock(${medId}, 'unit_count', ${unit}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
        medicineGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

async function changeStock(id, field, currentVal, step) {
    if (id === 0) return;
    if (typeof dbUpdateStock === 'function') {
        const newVal = currentVal + step;
        const success = await dbUpdateStock(id, field, newVal);
        if (success) loadDashboardData();
    }
}

/* ==========================================================================
   4. 🏃 ကျန်းမာရေး မှတ်တမ်းများ ထည့်သွင်းခြင်းနှင့် ဖော်ပြခြင်းစနစ်
   ========================================================================== */
function initLogButtons() {
    // လေ့ကျင့်ခန်း ခလုတ် နှိပ်လိုက်လျှင်
    if (btnAddExercise) {
        btnAddExercise.addEventListener('click', async () => {
            const title = prompt("ပြုလုပ်ခဲ့သည့် လေ့ကျင့်ခန်း အမည် ရိုက်ထည့်ပါ (ဥပမာ - လမ်းလျှောက်ခြင်း):");
            const duration = prompt("ကြာမြင့်ချိန် မိနစ် (ဥပမာ - 30):");
            
            if (title && duration && typeof supabaseClient !== 'undefined') {
                await supabaseClient.from('exercises').insert([{ title, duration: parseInt(duration) }]);
                loadDashboardData();
            }
        });
    }

    // ဆေးခန်းပြသမှုမှတ်တမ်း ခလုတ် နှိပ်လိုက်လျှင်
    if (btnAddClinic) {
        btnAddClinic.addEventListener('click', async () => {
            const title = prompt("ဆေးခန်း သို့မဟုတ် ရောဂါအမည် (ဥပမာ - သွားကိုက်လို့):");
            const cost = prompt("ကုန်ကျစရိတ် ကျပ်ငွေ (ဥပမာ - 15000):");
            
            if (title && cost && typeof supabaseClient !== 'undefined') {
                await supabaseClient.from('clinic_visits').insert([{ title, cost: parseFloat(cost) }]);
                loadDashboardData();
            }
        });
    }
}

function renderHealthLogs(logs, type) {
    const listEl = type === 'exercises' ? exerciseList : clinicList;
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (!logs || logs.length === 0) {
        listEl.innerHTML = `<li class="log-item" style="color:gray;">မှတ်တမ်း မရှိသေးပါဗျာ</li>`;
        return;
    }
    
    logs.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString('my-MM', {hour: '2-digit', minute:'2-digit'});
        let html = '';
        if (type === 'exercises') {
            html = `<li class="log-item"><span>🏃 ${log.title}</span><strong>${log.duration || 0} မိနစ်</strong></li>`;
        } else {
            html = `<li class="log-item"><span>🏥 ${log.title}</span><strong>${log.cost || 0} ကျပ်</strong></li>`;
        }
        listEl.insertAdjacentHTML('beforeend', html);
    });
}

function calculateSummary(exercises = [], clinicVisits = []) {
    // စုစုပေါင်း စရိတ်တွက်ရန်
    if (totalExpenseEl) {
        const totalCost = clinicVisits.reduce((sum, visit) => sum + (parseFloat(visit.cost) || 0), 0);
        totalExpenseEl.innerText = totalCost.toLocaleString();
    }
    // စုစုပေါင်း လေ့ကျင့်ခန်းအချိန်တွက်ရန်
    if (totalExerciseTimeEl) {
        const totalTime = exercises.reduce((sum, ex) => sum + (parseInt(ex.duration) || 0), 0);
        totalExerciseTimeEl.innerText = totalTime.toLocaleString();
    }
}

