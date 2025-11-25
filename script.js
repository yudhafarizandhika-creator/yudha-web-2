const defaultConfig = {
  business_name: 'HILDA LOUNDRY',
  thank_you_message: 'Terima kasih telah menggunakan layanan kami!'
};

let currentReceiptData = null;

// TABEL HARGA
const priceList = {
    Reguler: {
        CuciLipat: 3000, 
        CuciGosok: 6000
    },
    Express: {
        CuciLipat: 5000, 
        CuciGosok: 8000
    }
};

// Fungsi pembantu untuk membulatkan berat ke 2 desimal saat ditampilkan (contoh: 2.2 -> 2.20)
function formatWeight(weight) {
    return parseFloat(weight).toFixed(2);
}

// FUNGSI: Menghitung tanggal pengambilan
function calculatePickupDate(serviceSpeed, currentDate) {
    const date = new Date(currentDate);
    let daysToAdd = 0;

    if (serviceSpeed === 'Reguler') {
        daysToAdd = 3;
    } else if (serviceSpeed === 'Express') {
        daysToAdd = 1;
    }

    date.setDate(date.getDate() + daysToAdd);
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}


// Mengatur tampilan bagian tambahan (extras)
document.getElementById('toggleExtras').addEventListener('click', function() {
  const extrasSection = document.getElementById('extrasSection');
  const toggleBtn = document.getElementById('toggleExtras');
  
  if (extrasSection.classList.contains('hidden')) {
    extrasSection.classList.remove('hidden');
    toggleBtn.textContent = '- Tutup';
    toggleBtn.style.background = '#ef4444'; 
  } else {
    extrasSection.classList.add('hidden');
    toggleBtn.textContent = '+ Tambah';
    toggleBtn.style.background = '#4299e1'; 
    document.getElementById('extraItems').value = '0';
  }
});

// Fungsi untuk menangani perubahan konfigurasi (jika menggunakan Element SDK)
async function onConfigChange(config) {
  const businessName = config.business_name || defaultConfig.business_name;

  document.getElementById('businessName').textContent = businessName;
  document.getElementById('receiptBusinessName').textContent = businessName;

  if (currentReceiptData) {
    currentReceiptData.businessName = businessName;
  }
}

// Inisialisasi Element SDK (jika ada)
if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange,
    mapToCapabilities: (config) => ({
      recolorables: [],
      borderables: [],
      fontEditable: undefined,
      fontSizeable: undefined
    }),
    mapToEditPanelValues: (config) => new Map([
      ['business_name', config.business_name || defaultConfig.business_name],
      ['thank_you_message', config.thank_you_message || defaultConfig.thank_you_message]
    ])
  });
}

// Fungsi untuk membuat nomor resi unik
function generateReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `HL-${year}${month}${day}-${random}`;
}

// Fungsi untuk memformat tanggal
function formatDate(date) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
}

// Fungsi untuk memformat mata uang (IDR)
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Fungsi untuk membersihkan nomor telepon menjadi format internasional (62...)
function cleanPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Handler saat formulir disubmit
document.getElementById('laundryForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const config = window.elementSdk ? window.elementSdk.config : defaultConfig;
  const businessName = config.business_name || defaultConfig.business_name;

  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone = document.getElementById('customerPhone').value.trim();
  const customerAddress = document.getElementById('customerAddress').value.trim();
  const serviceSpeed = document.getElementById('serviceSpeed').value; 
  const serviceType = document.getElementById('serviceType').value;
  
  const weight = parseFloat(document.getElementById('weight').value);
  const extraItems = parseInt(document.getElementById('extraItems').value) || 0;

  if (!serviceSpeed || !serviceType) {
      alert("Mohon lengkapi pilihan Kecepatan dan Jenis Layanan.");
      return;
  }

  const pricePerKg = priceList[serviceSpeed][serviceType];
  
  const subtotalClothes = weight * pricePerKg;
  const subtotalExtras = extraItems * 10000;
  const total = subtotalClothes + subtotalExtras; 

  const dateNow = new Date();
  const receiptNumber = generateReceiptNumber();
  const receiptDate = formatDate(dateNow);
  
  const pickupDate = calculatePickupDate(serviceSpeed, dateNow);

  // Menyimpan data nota saat ini
  currentReceiptData = {
    businessName,
    receiptNumber,
    receiptDate,
    customerName,
    customerPhone,
    customerAddress,
    serviceSpeed,
    serviceType,
    weight,
    pricePerKg,
    subtotalClothes,
    extraItems,
    subtotalExtras,
    total,
    pickupDate
  };

  // Mengisi data ke Nota (receiptCard)
  document.getElementById('receiptNumber').textContent = `Nomor Resi: ${receiptNumber}`;
  document.getElementById('receiptDate').textContent = receiptDate;
  document.getElementById('displayName').textContent = customerName;
  document.getElementById('displayPhone').textContent = customerPhone;
  document.getElementById('displayAddress').textContent = customerAddress;
  
  document.getElementById('displayServiceSpeed').textContent = serviceSpeed;
  document.getElementById('displayServiceType').textContent = serviceType === 'CuciLipat' ? 'Cuci Lipat' : 'Cuci Gosok';
  
  // ✅ PENGISIAN DATA TETAP SAMA, LOKASI ELEMEN DI HTML SUDAH BERUBAH
  document.getElementById('displayPickupDate').textContent = pickupDate; 
  
  document.getElementById('displayWeight').textContent = `${formatWeight(weight)} kg`;
  document.getElementById('displayPricePerKg').textContent = formatCurrency(pricePerKg);
  document.getElementById('displaySubtotal').textContent = formatCurrency(subtotalClothes);

  if (extraItems > 0) {
    document.getElementById('extrasReceiptSection').style.display = 'block';
    document.getElementById('displayExtraItems').textContent = `${extraItems} pcs`;
    document.getElementById('displayExtraSubtotal').textContent = formatCurrency(subtotalExtras);
  } else {
    document.getElementById('extrasReceiptSection').style.display = 'none';
  }

  document.getElementById('displayTotal').textContent = formatCurrency(total);

  // Menampilkan Nota dan menyembunyikan Formulir
  document.getElementById('formCard').classList.add('hidden');
  document.getElementById('receiptCard').classList.add('active');
});

// Fungsi untuk mencetak nota (di-trigger oleh tombol di HTML)
function printReceipt() {
  window.print();
}

// Fungsi untuk mengirim nota via WhatsApp (di-trigger oleh tombol di HTML)
function sendWhatsApp() {
  if (!currentReceiptData) return;

  const config = window.elementSdk ? window.elementSdk.config : defaultConfig;
  const thankYouMessage = config.thank_you_message || defaultConfig.thank_you_message;

  const displayServiceType = currentReceiptData.serviceType === 'CuciLipat' ? 'Cuci Lipat' : 'Cuci Gosok';
  
  let message = `Halo ${currentReceiptData.customerName}, ${thankYouMessage}

Berikut detail laundry Anda:
━━━━━━━━━━━━━━━━━━
📋 Nomor Resi: ${currentReceiptData.receiptNumber}
🚀 Kecepatan: ${currentReceiptData.serviceSpeed}
🧺 Jenis Layanan: ${displayServiceType}
🗓️ Estimasi Ambil: ${currentReceiptData.pickupDate}
⚖️ Berat Baju/Celana: ${formatWeight(currentReceiptData.weight)} kg 
💵 Subtotal Baju: ${formatCurrency(currentReceiptData.subtotalClothes)}`;

  if (currentReceiptData.extraItems > 0) {
    message += `\n🛏️ Selimut/Sprei: ${currentReceiptData.extraItems} pcs
💵 Subtotal Tambahan: ${formatCurrency(currentReceiptData.subtotalExtras)}`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━
💰 TOTAL: ${formatCurrency(currentReceiptData.total)}
━━━━━━━━━━━━━━━━━━

${currentReceiptData.businessName}`;

  const phone = cleanPhoneNumber(currentReceiptData.customerPhone);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

// Fungsi untuk membuat nota baru (di-trigger oleh tombol di HTML)
function createNewReceipt() {
  document.getElementById('laundryForm').reset();
  document.getElementById('formCard').classList.remove('hidden');
  document.getElementById('receiptCard').classList.remove('active');
  currentReceiptData = null;
  
  // Mengembalikan tampilan tombol tambahan
  document.getElementById('extrasSection').classList.add('hidden');
  document.getElementById('toggleExtras').textContent = '+ Tambah';
  document.getElementById('toggleExtras').style.background = '#4299e1'; 
}