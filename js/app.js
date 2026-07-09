// Global App States
let appMedicines = [];

// DOM Elements
const loadingEl = document.getElementById('loading');
const medicineGrid = document.getElementById('medicine-grid');
const totalExpenseEl = document.getElementById('total-expense');
const totalExerciseTimeEl = document.getElementById('total-exercise-time');

/* ==========================================================================
   1. Initialize App & Tab Navigation
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
            console.log("Supabase မှ ရလာသော ဒေတာများ:", appMedicines); // Debug စစ်ရန်
        } else {
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
        medicineGrid.innerHTML = `<p class="loading-state">ဆေးစာရင်း မရှိသေးပါဗျာ။ (Supabase ထဲတွင် row ရှိသော်လည်း မပေါ်ပါက config.js အား ပြန်စစ်ပါ)</p>`;
        return;
    }
    
    medicines.forEach(med => {
        // 💡 FIX: ဒေတာဘေ့စ်ထဲတွင် အမည်မရှိပါက default 'Unknown Medicine' ပြရန်
        const medName = med.name || 'Unknown Medicine';
        const medBrand = med.brand || 'General';
        
        // 💡 FIX: ဒေတာဘေ့စ်မှ id မပါလာပါက crash မဖြစ်စေရန် fallback လုပ်ခြင်း
        const medId = med.id || 0;
        
        const box = med.box_count || 0;
        const card = med.card_count || 0;
        const unit = med.unit_count || 0;
        const isOut = (box + card + unit) === 0;
        const cardClass = isOut ? 'med-card out-of-stock shadow-soft' : 'med-card shadow-soft'; /* */
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
    if (id === 0) return; // ID မှားနေပါက ဆက်မလုပ်ရန် တားဆီးခြင်း
    if (typeof dbUpdateStock === 'function') {
        const newVal = currentVal + step;
        const success = await dbUpdateStock(id, field, newVal);
        if (success) loadDashboardData();
    }
}

function calculateSummary() {
    if (totalExpenseEl) totalExpenseEl.innerText = "0"; 
    if (totalExerciseTimeEl) totalExerciseTimeEl.innerText = "0";
}
