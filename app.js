import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    setDoc, 
    getDoc,
    query,
    orderBy 
} from "./firebase.js";

// Elementlər
const homePage = document.getElementById('homePage');
const settingsPage = document.getElementById('settingsPage');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const carSelectModal = document.getElementById('carSelectModal');

// Tarixçə Modalı Elementləri
const historyModal = document.getElementById('historyModal');
const openHistoryModalBtn = document.getElementById('openHistoryModalBtn');
const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
const changeCarBtn = document.getElementById('changeCarBtn');

// Səhifə keçidləri və Geri düyməsi idarəetməsi
openSettingsBtn.addEventListener('click', () => {
    history.pushState({ settingsOpen: true }, '', window.location.href);
    homePage.classList.remove('active');
    settingsPage.classList.add('active');
});

// İdarəetmə panelindəki geri düyməsi
closeSettingsBtn.addEventListener('click', () => {
    history.back();
});

// Modal Açılış Tarixçə İdarəetməsi (Telefonun Geri düyməsi üçün)
function openModalWithHistory(modalElement) {
    history.pushState({ modalOpen: true }, '', window.location.href);
    modalElement.style.display = 'flex';
}

// Tarixçə Modalı Aç/Bağla
openHistoryModalBtn.addEventListener('click', () => {
    openModalWithHistory(historyModal);
});

closeHistoryModalBtn.addEventListener('click', () => {
    history.back();
});

changeCarBtn.addEventListener('click', () => {
    carSelectModal.style.display = 'flex';
});

// --- TELEFONUN GERİ DÜYMƏSİNİ (BACK BUTTON) DİNLƏMƏK ---
window.addEventListener('popstate', (event) => {
    const detailModal = document.getElementById('detailModal');
    const historyModal = document.getElementById('historyModal');
    const confirmModal = document.getElementById('confirmModal');

    if (confirmModal && confirmModal.style.display === 'flex') {
        confirmModal.style.display = 'none';
        return;
    }

    if (detailModal && detailModal.style.display === 'flex') {
        detailModal.style.display = 'none';
        return;
    }

    if (historyModal && historyModal.style.display === 'flex') {
        historyModal.style.display = 'none';
        return;
    }

    // Əgər Ayarlar (İdarəetmə Paneli) açıqdırsə, əsas səhifəyə qayıt
    if (settingsPage.classList.contains('active')) {
        settingsPage.classList.remove('active');
        homePage.classList.add('active');
    }
});

// Qlobal dəyişənlər
let cars = [];
let selectedCar = null;
let allRecords = [];

// 1. FIREBASE-DƏN MAŞINLARI VƏ QİYMƏTLƏRİ YÜKLƏ
async function loadInitialData() {
    try {
        const carSnapshot = await getDocs(collection(db, "cars"));
        cars = [];
        carSnapshot.forEach(docSnap => {
            cars.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (cars.length === 0) {
            const carRef = await addDoc(collection(db, "cars"), { name: "Opel Astra", fuelType: "92" });
            cars = [{ id: carRef.id, name: "Opel Astra", fuelType: "92" }];
        }

        const pricesDoc = await getDoc(doc(db, "settings", "fuelPrices"));
        if (pricesDoc.exists()) {
            const prices = pricesDoc.data();
            document.getElementById('price92').value = prices.p92 || 1.10;
            document.getElementById('priceDizel').value = prices.pDizel || 1.00;
        }

        renderModalCars();
        renderCars();
    } catch (error) {
        console.error("Firebase yüklənmə xətası:", error);
    }
}

// Seçilmiş maşını UI-da qurmaq
function selectCar(car) {
    selectedCar = car;
    carSelectModal.style.display = 'none';
    document.getElementById('activeCarDisplay').textContent = car.name;
    
    const fType = car.fuelType || '92';
    document.getElementById('activeFuelDisplay').textContent = fType === 'dizel' ? 'Dizel' : `Aİ-${fType}`;
    
    calculateTotal();
    loadFuelHistory();
}

// 2. MODALDA YALNIZ MAŞIN NÖMRƏLƏRİNİ GÖSTƏR
function renderModalCars() {
    const modalContainer = document.getElementById('modalCarList');
    
    if (!selectedCar) {
        carSelectModal.style.display = 'flex';
    }

    if (cars.length === 0) {
        modalContainer.innerHTML = `
            <div style="text-align: center; padding: 15px;">
                <p style="font-size: 12px; color: var(--text-secondary);">Heç bir maşın tapılmadı. İdarəetmə panelindən əlavə edin.</p>
            </div>
        `;
        return;
    }

    modalContainer.innerHTML = '';
    cars.forEach(car => {
        const btn = document.createElement('button');
        btn.style.cssText = `background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; width: 100%;`;
        
        btn.innerHTML = `<span>${car.name}</span> <i class="ri-arrow-right-s-line" style="color: var(--accent-color);"></i>`;
        
        btn.addEventListener('click', () => {
            selectCar(car);
        });

        modalContainer.appendChild(btn);
    });
}

// 3. İDARƏETMƏ PANELİNDƏ MAŞINLARI RENDER ET
function renderCars() {
    const container = document.getElementById('carListContainer');
    container.innerHTML = '';

    cars.forEach(car => {
        const isSelected = selectedCar && selectedCar.id === car.id;
        const item = document.createElement('div');
        item.style.cssText = `display: flex; justify-content: space-between; align-items: center; background: var(--bg-color); padding: 10px 14px; border-radius: 12px; border: 1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'};`;
        
        const fText = car.fuelType === 'dizel' ? 'Dizel' : `Aİ-${car.fuelType || '92'}`;

        item.innerHTML = `
            <div>
                <span style="font-size: 14px; font-weight: 600; color: ${isSelected ? 'var(--accent-color)' : 'var(--text-primary)'};">${car.name}</span>
                <span style="font-size: 11px; color: var(--text-secondary); display: block;">Yanacaq: ${fText}</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="select-car-btn" data-id="${car.id}" style="background: ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;">${isSelected ? 'Seçilib' : 'Seç'}</button>
                <button type="button" class="delete-car-btn" data-id="${car.id}" style="background: rgba(244, 63, 94, 0.2); color: #f43f5e; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; cursor: pointer;"><i class="ri-delete-bin-line"></i></button>
            </div>
        `;
        container.appendChild(item);
    });

    document.querySelectorAll('.select-car-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const found = cars.find(c => c.id === id);
            if (found) {
                selectCar(found);
                renderCars();
            }
        });
    });

    document.querySelectorAll('.delete-car-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm("Bu avtomobili silmək istədiyinizdən əminsiniz?")) {
                await deleteDoc(doc(db, "cars", id));
                cars = cars.filter(c => c.id !== id);
                if (selectedCar && selectedCar.id === id) {
                    selectedCar = null;
                    carSelectModal.style.display = 'flex';
                }
                renderCars();
                renderModalCars();
            }
        });
    });
}

// 4. YENİ MAŞIN ƏLAVƏ ET
document.getElementById('addCarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newCarName');
    const fuelTypeSelect = document.getElementById('newCarFuelType');
    const carName = input.value.trim();
    const fuelType = fuelTypeSelect.value;

    if (carName) {
        const newCarData = { name: carName, fuelType: fuelType };
        const docRef = await addDoc(collection(db, "cars"), newCarData);
        cars.push({ id: docRef.id, ...newCarData });
        input.value = '';
        renderCars();
        renderModalCars();
    }
});

// 5. QİYMƏTLƏRİ DÜYMƏ İLƏ YADDA SAXLA
document.getElementById('savePricesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p92 = parseFloat(document.getElementById('price92').value) || 0;
    const pDizel = parseFloat(document.getElementById('priceDizel').value) || 0;

    await setDoc(doc(db, "settings", "fuelPrices"), { p92, pDizel });
    showNotification("Yanacaq qiymətləri uğurla yadda saxlanıldı!", "success");
    calculateTotal();
});

// 6. İKİTƏRƏFLİ AVTOMATİK HESABLAMA (Litr <-> Məbləğ)
const litersInput = document.getElementById('liters');
const amountInput = document.getElementById('amount');

let isCalculating = false;

function getFuelPrice() {
    if (!selectedCar) return 1.10;
    const fType = selectedCar.fuelType || '92';
    if (fType === 'dizel') return parseFloat(document.getElementById('priceDizel').value) || 1.00;
    return parseFloat(document.getElementById('price92').value) || 1.10;
}

litersInput.addEventListener('input', () => {
    if (isCalculating) return;
    isCalculating = true;

    const liters = parseFloat(litersInput.value);
    const price = getFuelPrice();
    
    if (!isNaN(liters) && liters > 0) {
        amountInput.value = (liters * price).toFixed(2);
    } else {
        amountInput.value = '';
    }

    isCalculating = false;
});

amountInput.addEventListener('input', () => {
    if (isCalculating) return;
    isCalculating = true;

    const amount = parseFloat(amountInput.value);
    const price = getFuelPrice();
    
    if (!isNaN(amount) && amount > 0 && price > 0) {
        litersInput.value = (amount / price).toFixed(1);
    } else {
        litersInput.value = '';
    }

    isCalculating = false;
});

function calculateTotal() {}

litersInput.addEventListener('input', calculateTotal);

// 7. YANACAQ QEYDİNİ YAZ
let isSubmitting = false;

const fuelForm = document.getElementById('fuelForm');
fuelForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedCar) {
        showNotification("Zəhmət olmasa ilk öncə maşın seçin!", "error");
        return;
    }

    const liters = parseFloat(litersInput.value);
    const amount = parseFloat(amountInput.value);
    const odometer = parseInt(document.getElementById('odometer').value);

    if (!liters || liters <= 0 || !odometer || odometer <= 0) {
        showNotification("Zəhmət olmasa litr və probeq məlumatlarını düzgün daxil edin!", "error");
        return;
    }

    const now = new Date();
    const isDuplicate = allRecords.some(record => {
        if (!record.timestamp) return false;
        const recTime = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
        const timeDiff = (now - recTime) / 1000;

        return record.carId === selectedCar.id &&
               record.liters === liters &&
               record.odometer === odometer &&
               timeDiff < 10;
    });

    if (isDuplicate) {
        showNotification("Bu qeyd artıq əlavə olunub!", "error");
        return;
    }

    const submitBtn = fuelForm.querySelector('.submit-btn');
    const originalBtnHTML = submitBtn.innerHTML;

    try {
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerHTML = `<i class="ri-loader-4-line spinner" style="margin: 0; width: 16px; height: 16px; border-width: 2px;"></i> Yadda saxlanılır...`;

        const record = {
            carId: selectedCar.id,
            carName: selectedCar.name,
            fuelType: selectedCar.fuelType || '92',
            liters: liters,
            amount: amount,
            odometer: odometer,
            timestamp: new Date()
        };

        await addDoc(collection(db, "fuelRecords"), record);
        showNotification(`${selectedCar.name} üçün ${amount.toFixed(2)} AZN qeydi yadda saxlanıldı!`, "success");

        fuelForm.reset();
        amountInput.value = '';
        await loadFuelHistory();

    } catch (error) {
        console.error("Qeyd yazılarkən xəta baş verdi:", error);
        showNotification("Xəta baş verdi, yenidən cəhd edin.", "error");
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerHTML = originalBtnHTML;
    }
});

// 8. TARİXÇƏNİ YÜKLƏ VƏ FİLTRLƏ
async function loadFuelHistory() {
    if (!selectedCar) return;

    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<p style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 10px;">Yüklənir...</p>';

    try {
        const q = query(collection(db, "fuelRecords"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        allRecords = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.carId === selectedCar.id) {
                allRecords.push({ id: docSnap.id, ...data });
            }
        });

        displayFilteredRecords(allRecords);

    } catch (error) {
        console.error("Tarixçə yüklənmə xətası:", error);
    }
}

// Qeydləri Ekrana Çıxaran Köməkçi Funksiya
function displayFilteredRecords(records) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    let totalSpend = 0;
    let totalLiters = 0;
    let lastOdometer = 0;
    let count = 0;

    records.forEach(data => {
        totalSpend += data.amount;
        totalLiters += data.liters;
        if (data.odometer > lastOdometer) lastOdometer = data.odometer;

        count++;
        const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
        const dateStr = dateObj.toLocaleDateString('az-AZ');
        const fText = data.fuelType === 'dizel' ? 'Dizel' : `Aİ-${data.fuelType}`;

        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; cursor: pointer;';
        
        // Tarixçə kartında yalnız yanacaq növü, litr və tarix görünür (Probeq silindi)
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="item-icon"><i class="ri-gas-station-fill"></i></div>
                <div class="item-details">
                    <h4>${fText} • ${data.liters} Litr</h4>
                    <p>${dateStr}</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="item-price" style="color: var(--accent-color); font-weight: 700;">${data.amount.toFixed(2)} ₼</div>
                <button type="button" class="delete-icon-btn" style="background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;" title="Sil">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;

        const openDeleteModal = (e) => {
            if (e) e.stopPropagation();

            const confirmModal = document.getElementById('confirmModal');
            const confirmModalText = document.getElementById('confirmModalText');
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

            confirmModalText.textContent = `${dateStr} tarixindəki ${data.amount.toFixed(2)} AZN məbləğindəki qeydi silmək istəyirsiniz?`;
            confirmModal.style.display = 'flex';

            const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
            confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);

            const newCancelBtn = cancelDeleteBtn.cloneNode(true);
            cancelDeleteBtn.parentNode.replaceChild(newCancelBtn, cancelDeleteBtn);

            newCancelBtn.addEventListener('click', () => {
                confirmModal.style.display = 'none';
            });

            newConfirmBtn.addEventListener('click', async () => {
                try {
                    await deleteDoc(doc(db, "fuelRecords", data.id));
                    confirmModal.style.display = 'none';
                    document.getElementById('detailModal').style.display = 'none';
                    loadFuelHistory();
                    showNotification("Qeyd uğurla silindi!", "success");
                } catch (error) {
                    console.error("Silinmə xətası:", error);
                    showNotification("Silinərkən xəta baş verdi.", "error");
                }
            });
        };

        const deleteBtn = item.querySelector('.delete-icon-btn');
        deleteBtn.addEventListener('click', openDeleteModal);

        item.addEventListener('click', () => {
            const detailModal = document.getElementById('detailModal');
            document.getElementById('detailCarName').textContent = data.carName || selectedCar.name;
            document.getElementById('detailFuelType').textContent = fText;
            document.getElementById('detailLiters').textContent = `${data.liters} L`;
            document.getElementById('detailAmount').textContent = `${data.amount.toFixed(2)} AZN`;
            document.getElementById('detailOdometer').textContent = `${data.odometer} km`;
            document.getElementById('detailDate').textContent = dateStr;

            const deleteFromDetailBtn = document.getElementById('deleteFromDetailBtn');
            const newDeleteFromDetailBtn = deleteFromDetailBtn.cloneNode(true);
            deleteFromDetailBtn.parentNode.replaceChild(newDeleteFromDetailBtn, deleteFromDetailBtn);
            newDeleteFromDetailBtn.addEventListener('click', openDeleteModal);

            openModalWithHistory(detailModal);
        });

        historyList.appendChild(item);
    });

    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    if (closeDetailModalBtn) {
        closeDetailModalBtn.onclick = () => {
            history.back();
        };
    }

    document.getElementById('totalSpend').textContent = totalSpend.toFixed(2);
    document.getElementById('totalLiters').textContent = `${totalLiters.toFixed(1)} L yanacaq`;
    document.getElementById('lastOdometer').textContent = `${lastOdometer} km`;

    const modalSpend = document.getElementById('modalTotalSpend');
    const modalLiters = document.getElementById('modalTotalLiters');
    if (modalSpend) modalSpend.textContent = `${totalSpend.toFixed(2)} AZN`;
    if (modalLiters) modalLiters.textContent = `${totalLiters.toFixed(1)} L`;

    if (count === 0) {
        historyList.innerHTML = '<p style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 10px;">Seçilən aralıqda qeyd tapılmadı.</p>';
    }
}

// 9. TARİX ARALIĞI FİLTRLƏMƏ DÜYMƏLƏRİ
document.getElementById('applyFilterBtn').addEventListener('click', () => {
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDate').value;

    if (!startVal || !endVal) {
        showNotification("Zəhmət olmasa həm başlanğıc, həm də bitiş tarixini seçin!", "error");
        return;
    }

    const startDate = new Date(startVal);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endVal);
    endDate.setHours(23, 59, 59, 999);

    const filtered = allRecords.filter(record => {
        if (!record.timestamp) return false;
        const recordDate = record.timestamp.toDate();
        return recordDate >= startDate && recordDate <= endDate;
    });

    displayFilteredRecords(filtered);
});

document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    displayFilteredRecords(allRecords);
});

// Başlanğıc
loadInitialData();

// --- BİLDİRİŞ (TOAST) FUNKSİYASI ---
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;
    toast.className = `show ${type}`;

    if (type === 'success') {
        toastIcon.className = 'ri-checkbox-circle-line';
    } else if (type === 'error') {
        toastIcon.className = 'ri-error-warning-line';
    } else {
        toastIcon.className = 'ri-information-line';
    }

    setTimeout(() => {
        toast.className = '';
    }, 3000);
}

// --- MODALIN ÇÖLünə KLİKLƏYƏNDƏ BAĞLANMASI ---
window.addEventListener('click', (e) => {
    const historyModal = document.getElementById('historyModal');
    const detailModal = document.getElementById('detailModal');
    const confirmModal = document.getElementById('confirmModal');

    // Əgər birbaşa modalın özünə (qara fon overlay-ə) kliklənibsə, pəncərəni bağla
    if (e.target === historyModal) {
        history.back(); // Tarixçəni sinxron saxlamaq üçün history.back() istifadə edirik
    }
    if (e.target === detailModal) {
        history.back();
    }
    if (e.target === confirmModal) {
        confirmModal.style.display = 'none';
    }
});

// --- PROBEQ KAMERA SKANERİ MƏNTİQİ ---
const openOdometerScannerBtn = document.getElementById('openOdometerScannerBtn');
const scannerModal = document.getElementById('scannerModal');
const closeScannerModalBtn = document.getElementById('closeScannerModalBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const odometerImageInput = document.getElementById('odometerImageInput');
const detectedResultArea = document.getElementById('detectedResultArea');
const detectedNumberBox = document.getElementById('detectedNumberBox');
const confirmOdometerBtn = document.getElementById('confirmOdometerBtn');

let scannedOdometerValue = '';

openOdometerScannerBtn.addEventListener('click', () => {
    scannerModal.style.display = 'flex';
    detectedResultArea.style.display = 'none';
    confirmOdometerBtn.style.display = 'none';
});

closeScannerModalBtn.addEventListener('click', () => {
    scannerModal.style.display = 'none';
});

takePhotoBtn.addEventListener('click', () => {
    odometerImageInput.click(); // Telefonun kamerasını və ya qalereyasını açır
});

odometerImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    takePhotoBtn.innerHTML = `<i class="ri-loader-4-line spinner" style="font-size: 32px;"></i> <span>Oxunur, zəhmət olmasa gözləyin...</span>`;

    try {
        // Tesseract.js ilə şəkildəki rəqəmləri oxuyuruq
        const result = await Tesseract.recognize(
            file,
            'eng', // İngilis simvolları/rəqəmləri
            { logger: m => console.log(m) }
        );

        const text = result.data.text;
        console.log("Oxunan mətn:", text);

        // Mətndən yalnız rəqəmləri təmizləyib çıxarırıq (məsələn: 160006)
        // Şəkildəki 432.2 və ya digər simvolları süzgəcdən keçirib ən uzun rəqəm qrupunu tapırıq
        const numbersFound = text.match(/\d+/g);
        
        if (numbersFound && numbersFound.length > 0) {
            // Adətən probeq ən uzun rəqəm olur (məsələn 160006)
            let bestMatch = numbersFound.reduce((a, b) => a.length > b.length ? a : b);
            
            scannedOdometerValue = bestMatch;
            detectedNumberBox.textContent = scannedOdometerValue;
            detectedResultArea.style.display = 'block';
            confirmOdometerBtn.style.display = 'block';
        } else {
            showNotification("Rəqəm tapılmadı, yenidən cəhd edin.", "error");
        }

    } catch (error) {
        console.error("OCR xətası:", error);
        showNotification("Şəkil oxunarkən xəta baş verdi.", "error");
    } finally {
        takePhotoBtn.innerHTML = `<i class="ri-camera-lens-line" style="font-size: 32px; color: var(--accent-color);"></i> <span>Kamera ilə çək və ya şəkil seç</span>`;
    }
});

// Tapılan rəqəmin üzərinə vuranda və ya Təsdiq Et düyməsinə basanda
const applyScannedValue = () => {
    if (scannedOdometerValue) {
        document.getElementById('odometer').value = scannedOdometerValue;
        scannerModal.style.display = 'none';
        showNotification(`Probeq təyin edildi: ${scannedOdometerValue} km`, "success");
    }
};

detectedNumberBox.addEventListener('click', applyScannedValue);
confirmOdometerBtn.addEventListener('click', applyScannedValue);