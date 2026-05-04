

// GLOBAL CART
// ===============================
let cart = [];
let menuData = [];
window.tempLat = -6.2856; 
window.tempLng = 107.1706;
window.selectedLocation = null;// ===============================
// FIRESTORE IMPORT (DYNAMIC)
// ===============================
let db;
window.addEventListener("load", async () => {
    db = window.db;
    loadMenuRealtime();
});
// Letakkan di bagian paling atas file WADJS.js setelah deklarasi variabel global
window.confirmLocation = function(inputId) {
    const addressDetail = document.getElementById(inputId).value;
    
    if (window.tempLat && window.tempLng) {
        window.selectedLocation = {
            lat: window.tempLat,
            lng: window.tempLng,
            address: addressDetail || "No detail provided"
        };
        appendMessage(`✅ Location saved: ${window.selectedLocation.address}`);
        processCheckout(); 
    } else {
        alert("Location is not ready, please move the map pin.");
    }
};
async function processCheckout() {
    if (cart.length === 0) {
        appendMessage("Your cart is still empty. Let's choose a menu first!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const chat = document.getElementById("chat-window");
    
    const checkoutDiv = document.createElement("div");
    checkoutDiv.className = "msg-bot animate-in";
    
    let itemsHtml = cart.map(item => `
        <div class="flex justify-between text-xs mb-1 border-b border-white/5 pb-1">
            <span>${item.name} x${item.quantity}</span>
            <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');

    checkoutDiv.innerHTML = `
        <div class="bot-avatar">🧾</div>
        <div class="bubble-bot" style="min-width: 250px;">
            <span class="sender-name">Ringkasan Pesanan</span>
            <div class="my-3 text-gray-300">
                ${itemsHtml}
                <div class="flex justify-between font-bold mt-2 text-white border-t border-orange-500 pt-2">
                    <span>Total</span>
                    <span>Rp ${total.toLocaleString()}</span>
                </div>
            </div>
            <p class="text-[10px] mb-2 text-gray-400">Pilih metode pembayaran:</p>
            <div class="flex flex-col gap-2">
                <button onclick="handlePayment('E-Wallet')" class="bg-white/10 hover:bg-white/20 p-2 rounded-lg flex justify-between items-center transition-all">
                    <span class="text-xs">OVO / GoPay / Dana</span>
                    <span>📱</span>
                </button>
                <button onclick="handlePayment('COD')" class="bg-white/10 hover:bg-white/20 p-2 rounded-lg flex justify-between items-center transition-all">
                    <span class="text-xs">Cash on Delivery</span>
                    <span>💵</span>
                </button>
            </div>
        </div>
    `;
    if (!selectedLocation) {
    appendMessage("📍 You must select a delivery location first.");
    showMap(); // Memanggil fungsi peta secara otomatis
    return;
}
    chat.appendChild(checkoutDiv);
    chat.scrollTop = chat.scrollHeight;
}
async function addToCart(id, qty = 1) {
    // 1. Cari data produk di menuData berdasarkan ID
    const item = menuData.find(m => m.id === id);
    if (!item) return;

    // 2. Cek apakah stok mencukupi
    if (item.stock < qty) {
        appendMessage(`⚠️ Sorry, stock ${item.name} is insufficient.`);
        return;
    }

    try {
        // 3. Update stok di Firestore secara realtime
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
        const productRef = doc(db, "products", id);
        
        await updateDoc(productRef, {
            stock: item.stock - qty
        });

        // 4. Masukkan ke dalam array cart (keranjang lokal)
        const existingItem = cart.find(c => c.id === id);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: qty,
                emoji: item.emoji
            });
        }

        // 5. Update UI: Badge keranjang dan tampilkan preview
        updateCartBadge();
        showCartPreview();

    } catch (error) {
        console.error("Failed to add to cart:", error);
        appendMessage("❌ An error occurred while updating stock.");
    }
}
function showCartPreview() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lastItem = cart[cart.length - 1];

    const chat = document.getElementById("chat-window");
    const div = document.createElement("div");
    div.className = "msg-bot animate-in";
    div.innerHTML = `
        <div class="bot-avatar">🛒</div>
        <div class="bubble-bot">
            <p>Successfully added <b>${lastItem.name}</b>!</p>
            <p class="text-[10px] mt-1 text-gray-400">Current total: Rp ${total.toLocaleString()}</p>
            <button onclick="processCheckout()" class="btn-pill btn-orange mt-2 w-full">Checkout Now</button>
        </div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}
// ===============================
// CART FLOAT BADGE
function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const badge = document.getElementById("cart-count");
    const trigger = document.getElementById("cart-trigger");
    
    if (badge) badge.innerText = count;
    if (trigger) {
        // Tombol akan muncul (remove hidden) jika ada isi, dan sembunyi jika kosong
        if (count > 0) {
            trigger.classList.remove("hidden");
        } else {
            trigger.classList.add("hidden");
        }
    }
}

// Fungsi untuk melihat isi keranjang
window.viewCart = function() {
    const chat = document.getElementById("chat-window");
    
    if (cart.length === 0) {
        appendMessage("Your cart is still empty. Let's choose a menu first!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartDiv = document.createElement("div");
    cartDiv.className = "msg-bot animate-in";
    
    let itemsHtml = cart.map((item, index) => `
        <div class="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/5">
            <div>
                <span class="font-semibold text-white">${item.name}</span>
                <div class="text-[10px] text-gray-400">x${item.quantity} @ Rp ${item.price.toLocaleString()}</div>
            </div>
            <div class="flex flex-col items-end">
                <span class="text-orange-400 font-bold">Rp ${(item.price * item.quantity).toLocaleString()}</span>
                <button onclick="removeFromCart(${index})" class="text-[9px] text-red-500 hover:text-red-400 mt-1">Hapus</button>
            </div>
        </div>
    `).join('');

    cartDiv.innerHTML = `
        <div class="bot-avatar">🛒</div>
        <div class="bubble-bot" style="min-width: 260px;">
            <span class="sender-name">Isi Keranjangmu</span>
            <div class="my-3 max-h-48 overflow-y-auto custom-scroll pr-2">
                ${itemsHtml}
            </div>
            <div class="flex justify-between font-bold text-white border-t border-orange-500 pt-2 mb-3">
                <span>Total Pesanan</span>
                <span>Rp ${total.toLocaleString()}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="processCheckout()" class="btn-pill btn-orange flex-1">Checkout</button>
                <button onclick="appendMessage('menu', false); sendMessage();" class="btn-pill btn-outline flex-1 text-[10px]">Add More</button>
            </div>
        </div>
    `;

    chat.appendChild(cartDiv);
    chat.scrollTop = chat.scrollHeight;
};
// ===============================
// CHATBOT INPUT
// ===============================
window.viewCart = function() {
    const chat = document.getElementById("chat-window");
    
    // Jika keranjang kosong
    if (cart.length === 0) {
        appendMessage("Your cart is still empty. Let's choose a menu first!");
        return;
    }

    // Hitung total harga
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const cartDiv = document.createElement("div");
    cartDiv.className = "msg-bot animate-in";
    
    // Buat daftar item di dalam keranjang
    let itemsHtml = cart.map((item, index) => `
        <div class="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/5">
            <div>
                <span class="font-semibold text-white">${item.name}</span>
                <div class="text-[10px] text-gray-400">x${item.quantity} @ Rp ${item.price.toLocaleString()}</div>
            </div>
            <div class="flex flex-col items-end">
                <span class="text-orange-400 font-bold">Rp ${(item.price * item.quantity).toLocaleString()}</span>
                <button onclick="removeFromCart(${index})" class="text-[9px] text-red-500 hover:text-red-400 mt-1">Remove</button>
            </div>
        </div>
    `).join('');

    cartDiv.innerHTML = `
        <div class="bot-avatar">🛒</div>
        <div class="bubble-bot" style="min-width: 260px;">
            <span class="sender-name">Your Cart</span>
            <div class="my-3 max-h-48 overflow-y-auto custom-scroll pr-2">
                ${itemsHtml}
            </div>
            <div class="flex justify-between font-bold text-white border-t border-orange-500 pt-2 mb-3">
                <span>Total Order</span>
                <span>Rp ${total.toLocaleString()}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="processCheckout()" class="btn-pill btn-orange flex-1">Checkout Now</button>
                <button onclick="appendMessage('menu')" class="btn-pill btn-outline flex-1 text-[10px]">Add More</button>
            </div>
        </div>
    `;

    chat.appendChild(cartDiv);
    chat.scrollTop = chat.scrollHeight;
};
window.removeFromCart = async function(index) {
    const item = cart[index];
    
    // 1. Kembalikan stok ke Firestore (Opsional tapi disarankan)
    try {
        const { doc, updateDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
        const ref = doc(db, "products", item.id);
        const snap = await getDoc(ref);
      
        if (snap.exists()) {
            await updateDoc(ref, { stock: snap.data().stock + item.quantity });
        }
    } catch (e) {
        console.error("Gagal mengupdate stok saat hapus:", e);
    }

    // 2. Hapus dari array cart
    cart.splice(index, 1);
    
    // 3. Update angka badge keranjang
    updateCartBadge();
    
    // 4. Beri feedback dan tampilkan ulang keranjang yang sudah diupdate
    appendMessage(`Delete <b>${item.name}</b> from cart.`);
    viewCart();
};
// ===============================

// CHATBOT INPUT (VERSI PERBAIKAN)
// ==============================
window.sendMessage = async function () {
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, false);
    const text = msg.toLowerCase();
    input.value = "";

    // LOGIKA ALL MENU
    if (text === "menu" || text.includes("all menu") || text.includes("semua menu") || text.includes("daftar menu") || text.includes("list menu")) {
        if (menuData.length === 0) {
            appendMessage("Sorry, there are currently no menus available in the database.");
        } else {
            appendMessage("Here is our entire menu list:");
            displayFoodCards(menuData); // Memanggil semua data tanpa filter
        }
    } 
    // ... (logika chat lainnya seperti 'lokasi' atau 'keranjang' tetap di bawahnya)
    else if (text.includes("lokasi") || text.includes("map") || text.includes("peta")) {
        appendMessage("Please specify the delivery location on the map:");
        showMap();
    }
    else if (text.includes("keranjang") || text.includes("cart")) {
        viewCart();
    }
    else if (text.includes("checkout") || text.includes("bayar")) {
        processCheckout();
    }
    else if (text.includes("history") || text.includes("riwayat")) {
        showHistory();
    }
    else {
        // NATURAL LANGUAGE CART PARSER (NLP)
        let matchedItemsForCart = [];
        let addedNames = new Set();
        
        // Cek apakah pesan mengindikasikan ingin memesan / angka
        menuData.forEach(item => {
            const itemName = (item.name || "").toLowerCase().trim();
            
            // Deduplicate to prevent double-adding if Firebase has identical overlapping entries
            if (itemName && itemName.length > 2 && text.includes(itemName) && !addedNames.has(itemName)) {
                
                // Escape name for Safe Regex
                const escapedName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Temukan angka di dekat nama makanan (contoh: "2 batagor" atau "batagor 2")
                const regex = new RegExp(`(\\d+)\\s*(?:porsi\\s*|x\\s*)?${escapedName}|${escapedName}\\s*(?:x\\s*)?(\\d+)`, 'i');
                const match = text.match(regex);
                
                let qty = 1; 
                if (match) {
                    if (match[1]) qty = parseInt(match[1]); 
                    else if (match[2]) qty = parseInt(match[2]); 
                }
                
                matchedItemsForCart.push({ item: item, quantity: qty });
                addedNames.add(itemName);
            }
        });

        if (matchedItemsForCart.length > 0) {
            matchedItemsForCart.forEach(match => {
                // Cek apakah sudah ada di keranjang
                const existing = cart.find(c => c.id === match.item.id);
                if (existing) {
                    existing.quantity += match.quantity;
                } else {
                    cart.push({
                        id: match.item.id,
                        name: match.item.name,
                        price: match.item.price,
                        quantity: match.quantity
                    });
                }
            });
            
            // Update UI Keranjang
            if(window.updateCartBadge) window.updateCartBadge();
            
            const addedText = matchedItemsForCart.map(m => `<b>${m.quantity}x ${m.item.name}</b>`).join(", ");
            appendMessage(`✅ Successfully added ${addedText} to your cart!`);
            viewCart();
            return; // Hentikan proses lebih lanjut
        }

        // FALLBACK LOGIKA KATEGORI & PENCARIAN
        const tags = ["sweet", "spicy", "cheap", "savory", "snack", "drink"];
        const detectedTags = tags.filter(tag => text.includes(tag));

        if (detectedTags.length > 0) {
            const results = menuData.filter(item =>
                detectedTags.some(tag => item.tags?.includes(tag))
            );
            if (results.length > 0) {
                appendMessage(`Found menu in category ${detectedTags.join(", ")}:`);
                displayFoodCards(results);
            } else {
                appendMessage("Sorry, that category is currently empty.");
            }
        } else {
            // Pencarian berdasarkan nama (Name search fallback)
            const searchResults = menuData.filter(item => {
                const itemName = (item.name || "").toLowerCase();
                return itemName && (itemName.includes(text) || text.includes(itemName));
            });
            if (searchResults.length > 0) {
                appendMessage(`Here are the menus for "${text}":`);
                displayFoodCards(searchResults);
            } else {
                appendMessage("Sorry, I didn't quite catch that. Try typing your order (e.g., 'i want 2 bakso') or type 'menu'!");
            }
        }
    }
};
async function loadMenuRealtime() {
    const { collection, onSnapshot } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
    
    // Pastikan nama koleksi sesuai dengan di Firebase Console kamu (misal: 'products')
    const q = collection(window.db, "products"); 

    onSnapshot(q, (snapshot) => {
        menuData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("Data Menu Berhasil Dimuat:", menuData);
    }, (error) => {
        console.error("Gagal mengambil menu:", error);
    });
}
function appendMessage(text, isBot = true) {
    const chat = document.getElementById("chat-window");

    const div = document.createElement("div");
    div.className = isBot ? "msg-bot animate-in" : "msg-user animate-in";

    div.innerHTML = isBot ? `
        <div class="bot-avatar">🤖</div>
        <div class="bubble-bot">
            <span class="sender-name">Assistant Bot</span>
            <p>${text}</p>
        </div>
    ` : `
        <div class="bubble-user">
            <p>${text}</p>
        </div>
    `;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

window.buyerMapInstances = {};

window.performGeocode = async function(inputId, mapId) {
    const q = document.getElementById(inputId).value;
    if(!q) return;
    try {
        const btn = document.getElementById('search-btn-' + mapId);
        btn.innerText = "⏳";
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if(data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            window.tempLat = lat;
            window.tempLng = lon;
            const instance = window.buyerMapInstances[mapId];
            if(instance) {
                instance.map.flyTo([lat, lon], 17);
                instance.marker.setLatLng([lat, lon]);
            }
            btn.innerText = "✅";
            setTimeout(() => { btn.innerText = "🔍"; }, 2000);
        } else {
            btn.innerText = "❌";
            alert("Location not found! Try searching for a street or city name.");
            setTimeout(() => { btn.innerText = "🔍"; }, 2000);
        }
    } catch(e) { console.error(e); }
}

function showMap() {
    const mapId = "map-" + Date.now();
    const addressInputId = "addr-" + Date.now();
    const searchInputId = "search-" + Date.now();
    
    appendMessage(`
        <div class="bg-white/5 p-3 rounded-xl border border-white/10">
            <p class="text-xs text-gray-400 mb-2">📍 Set Shipping Address Pin:</p>
            <div class="flex gap-2 mb-2">
                <input type="text" id="${searchInputId}" placeholder="Search place or street name..." class="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-orange-500" onkeypress="if(event.key === 'Enter') window.performGeocode('${searchInputId}', '${mapId}')">
                <button id="search-btn-${mapId}" onclick="window.performGeocode('${searchInputId}', '${mapId}')" class="bg-orange-500 text-black px-3 rounded-lg flex items-center justify-center text-xs">🔍</button>
            </div>
            <div id="${mapId}" style="height: 180px; width: 100%; border-radius: 8px; margin-bottom: 10px;"></div>
            <input type="text" id="${addressInputId}" 
                placeholder="House Details (e.g., Black Gate)" 
                class="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs mb-2 outline-none focus:border-orange-500">
            <button onclick="window.confirmLocation('${addressInputId}')" class="btn-pill btn-orange w-full">
            Confirm Location
            </button>
        </div>
    `, true);

    setTimeout(() => {
        const map = L.map(mapId).setView([window.tempLat, window.tempLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const marker = L.marker([window.tempLat, window.tempLng], { draggable: true }).addTo(map);
        window.buyerMapInstances[mapId] = { map, marker };

        // BAGIAN PENTING: Update koordinat saat pin digeser
        marker.on('dragend', function (e) {
             const pos = marker.getLatLng();
             window.tempLat = pos.lat;
             window.tempLng = pos.lng;
         });

        map.invalidateSize();
    }, 500);
}

// Gunakan window. agar bisa diakses oleh tombol HTML dinamis

window.processCheckout = function() {
    if (cart.length === 0) {
        appendMessage("Your cart is still empty. Let's choose a menu first!");
        return;
    }

    // VALIDASI LOKASI: Jika belum ada lokasi, arahkan ke Map
    if (!selectedLocation) {
        appendMessage("📍 <b>Delivery location not set.</b><br>Please select a location on the map before checking out.");
        showMap(); // Panggil fungsi peta yang sudah kita buat sebelumnya
        return;
    }
    async function processCheckout() {
    if (!selectedLocation) {
        showLocationPicker(); // Alur terhenti di sini jika lokasi belum ada
        return;
    }
    // ... sisa kode checkout
}
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const chat = document.getElementById("chat-window");
    
    const checkoutDiv = document.createElement("div");
    checkoutDiv.className = "msg-bot animate-in";
    
    let itemsHtml = cart.map(item => `
        <div class="flex justify-between text-xs mb-1 border-b border-white/5 pb-1">
            <span>${item.name} x${item.quantity}</span>
            <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');

    // Replace the payment button section in your processCheckout function
checkoutDiv.innerHTML = `
    <div class="bot-avatar">🧾</div>
    <div class="bubble-bot" style="min-width: 250px;">
        <span class="sender-name">Order Summary</span>
        <p class="text-[9px] text-orange-400 mb-2">Location: ${selectedLocation.address || "Location set"}</p>
        <div class="my-3 text-gray-300">
            ${itemsHtml}
            <div class="flex justify-between font-bold mt-2 text-white border-t border-orange-500 pt-2">
                <span>Total</span>
                <span>Rp ${total.toLocaleString()}</span>
            </div>
        </div>
        <p class="text-[10px] mb-2 text-gray-400">Select Payment Method:</p>
        <div class="flex flex-col gap-2">
            <button onclick="handlePayment('QRIS')" class="payment-btn">
                <span>QRIS (Automatic)</span><span>🖼️</span>
            </button>
            <button onclick="handlePayment('E-Wallet')" class="payment-btn">
                <span>OVO / GoPay / Dana</span><span>📱</span>
            </button>
            <button onclick="handlePayment('Cash')" class="payment-btn">
                <span>Cash on Delivery</span><span>💵</span>
            </button>
        </div>
    </div>
`;
    chat.appendChild(checkoutDiv);
    chat.scrollTop = chat.scrollHeight;
};
// ===============================
// PAYMENT & CHECKOUT PROCESS
// ===============================

// Handle the actual transaction
window.handlePayment = async function() {
    if (cart.length === 0) return alert("Keranjang kosong!");

    // 1. Hitung total harga
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        // 2. Import fungsi Firestore secara dinamis
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");

        // 3. KIRIM DATA (Ini yang otomatis membuat koleksi 'orders')
        await addDoc(collection(window.db, "orders"), {
            items: cart,
            totalPrice: total,
            status: "Selesai",
            timestamp: serverTimestamp(),
            location: window.selectedLocation || "Lokasi tidak ditentukan"
        });

        // 4. Feedback ke User
        alert("Pembayaran Berhasil & Riwayat Disimpan!");
        cart = []; // Kosongkan keranjang
        updateCartCount();
        appendMessage("Pesananmu sudah dicatat di histori. Ketik 'history' untuk melihat.");

    } catch (error) {
        console.error("Error simpan histori:", error);
        alert("Gagal menyimpan ke histori: " + error.message);
    }
};
window.handlePayment = async function(method) {
    if (cart.length === 0) return;
    
    // 1. Show processing message
    appendMessage(`Processing your <b>${method}</b> payment...`);

    // 2. Special UI for QRIS
    if (method === 'QRIS') {
        appendMessage(`
            <div class="bg-white p-3 rounded-xl flex flex-col items-center gap-2">
                <p class="text-black text-xs font-bold">Scan to Pay</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MakanAI-Order" alt="QRIS" class="w-32 h-32">
                <button onclick="finalizeOrder('QRIS')" class="btn-pill btn-orange w-full">I Have Paid</button>
            </div>
        `, true);
    } else {
        // Direct finalization for Cash or E-Wallet (simple version)
        finalizeOrder(method);
    }
};

// New function to save to Firestore after payment selection
window.finalizeOrder = async function(method) {
    try {
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
        
        const orderData = {
            items: cart,
            totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            method: method,
            location: window.selectedLocation,
            status: "Processing",
            timestamp: serverTimestamp()
        };

        await addDoc(collection(window.db, "orders"), orderData);

        // Success UI
        appendMessage(`✅ <b>Order Successful!</b><br>Method: ${method}<br>Your food is being prepared.`);
        
        // Reset
        cart = [];
        updateCartBadge();
        
    } catch (error) {
        console.error("Order Error:", error);
        appendMessage("❌ Error saving your order.");
    }
};
// Fungsi pembantu untuk logika bot
function handleBotLogic(text) {
    // Masukkan logika filter menuData Anda di sini
    // Contoh:
    if (text.includes("spicy") || text.includes("pedas")) {
        appendMessage("Here are some spicy menu options:");
        // ... filter menuData ...
    }
}
// Pastikan fungsi pendukungnya ada
function processBotResponse(text) {
    // Logika filter menu kamu yang sudah ada di WADJS.js pindahkan ke sini
    // Contoh:
    if (text.includes("spicy")) {
        appendMessage("Here are some spicy menu recommendations for you...");
        // ... filter menuData ...
    }
}
function displayFoodCards(items) {
    const chat = document.getElementById("chat-window");
    
    // 1. Buat kontainer utama untuk menampung banyak kartu
    const container = document.createElement("div");
    container.className = "results-container animate-in"; // Menggunakan class scrollable dari CSS kamu

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "food-card mb-2"; // Class dari WADCSS.css
        
        const isOutOfStock = item.stock <= 0;
        
        let imgUrl = item.image;
        if (!imgUrl) {
            const queryName = (item.name || "Food").toLowerCase().trim();
            const FOOD_MAP = [
                { key: "nasi goreng", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Chaufa_salvaje_Selva_17042010.JPG/330px-Chaufa_salvaje_Selva_17042010.JPG" },
                { key: "nasi", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Chaufa_salvaje_Selva_17042010.JPG/330px-Chaufa_salvaje_Selva_17042010.JPG" },
                { key: "sate", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Sate_Ponorogo.jpg/330px-Sate_Ponorogo.jpg" },
                { key: "ayam bakar", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Ayam_bakar_bumbu_rujak.jpg/330px-Ayam_bakar_bumbu_rujak.jpg" },
                { key: "ayam", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ayam_sambal_matah_dan_tempe_goreng.jpg/330px-Ayam_sambal_matah_dan_tempe_goreng.jpg" },
                { key: "sop iga", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Sop_Iga.jpg/330px-Sop_Iga.jpg" },
                { key: "iga", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Sop_Iga.jpg/330px-Sop_Iga.jpg" },
                { key: "bakso roket", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Bakso_mi_bihun.jpg/330px-Bakso_mi_bihun.jpg" },
                { key: "bakso", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Bakso_mi_bihun.jpg/330px-Bakso_mi_bihun.jpg" },
                { key: "orek tempe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tempeh_%288681605421%29.jpg/330px-Tempeh_%288681605421%29.jpg" },
                { key: "tempe goreng", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tempeh_%288681605421%29.jpg/330px-Tempeh_%288681605421%29.jpg" },
                { key: "tempe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tempeh_%288681605421%29.jpg/330px-Tempeh_%288681605421%29.jpg" },
                { key: "soto betawi", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Soto_Betawi_Daging_Sapi.jpg/330px-Soto_Betawi_Daging_Sapi.jpg" },
                { key: "soto", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Soto_Betawi_Daging_Sapi.jpg/330px-Soto_Betawi_Daging_Sapi.jpg" },
                { key: "es jeruk", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Orangejuice.jpg/330px-Orangejuice.jpg" },
                { key: "jeruk", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Orangejuice.jpg/330px-Orangejuice.jpg" },
                { key: "es teh manis", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/ES_TEH_MANIS.jpg/330px-ES_TEH_MANIS.jpg" },
                { key: "es teh", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/ES_TEH_MANIS.jpg/330px-ES_TEH_MANIS.jpg" },
                { key: "teh", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/ES_TEH_MANIS.jpg/330px-ES_TEH_MANIS.jpg" },
                { key: "gado", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Gado_gado.jpg/330px-Gado_gado.jpg" },
                { key: "burger", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/NCI_Visuals_Food_Hamburger.jpg/330px-NCI_Visuals_Food_Hamburger.jpg" },
                { key: "batagor", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Batagor.jpg/330px-Batagor.jpg" },
                { key: "mie", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Mi_ayam_jamur.JPG/330px-Mi_ayam_jamur.JPG" },
                { key: "jagung", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jagung_bakar.jpg/330px-Jagung_bakar.jpg" },
                { key: "macha", url: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=300&q=80" },
                { key: "matcha", url: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=300&q=80" },
                { key: "rendang", url: "https://images.unsplash.com/photo-1548943487-a2e4142f6f96?auto=format&fit=crop&w=300&q=80" }
            ];
            
            // Check original local testing images first
            if (queryName === "spicy" || queryName === "cheap" || queryName === "savory") {
                imgUrl = `images/${queryName}.jpg`;
            } else if (queryName === "sweet" || queryName === "sweets") {
                imgUrl = `images/sweets.jpg.webp`;
            } else {
                let found = false;
                for (const mapItem of FOOD_MAP) {
                    if (queryName.includes(mapItem.key)) {
                        imgUrl = mapItem.url;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    imgUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"; // generic beautiful healthy food
                }
            }
        }
        
        card.innerHTML = `
            <img src="${imgUrl}" class="menu-img">
            <div class="flex flex-col flex-1">
                <div class="flex items-center gap-2">
                    <span class="sender-name">${item.name || "Unnamed Menu"}</span>
                </div>  
                <div class="flex gap-1 mt-1">
                    <span class="tag-badge">${item.tags?.[0] || 'Menu'}</span>
                    <span class="text-[9px] text-gray-400">Stock: ${item.stock}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="price-container">
                    <span class="price-label">Price</span>
                    <span class="price-value">Rp ${Number(item.price).toLocaleString()}</span>
                </div>
                <button 
                    onclick="addToCart('${item.id}')" 
                    class="btn-pill btn-orange ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${isOutOfStock ? 'disabled' : ''}
                >
                    ${isOutOfStock ? 'Sold Out' : 'Add'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // 2. Masukkan semua kartu ke dalam bubble chat bot
    const msgDiv = document.createElement("div");
    msgDiv.className = "msg-bot animate-in";
    msgDiv.innerHTML = `
        <div class="bot-avatar">🤖</div>
        <div class="bubble-bot" style="max-width: 90%;">
            <span class="sender-name">Menu Catalog</span>
            <p>Please choose your favorite menu:</p>
            <div id="cards-wrapper"></div>
        </div>
    `;
    
    chat.appendChild(msgDiv);
    msgDiv.querySelector("#cards-wrapper").appendChild(container);
    
    chat.scrollTop = chat.scrollHeight;
}
function updateCartUI() {
    updateCartBadge(); // Memperbarui angka di icon keranjang
    if (cart.length > 0) {
        appendMessage(`You have ${cart.length} items in your cart. Type <b>"checkout"</b> to finish.`);
    }

    // 2. Inisialisasi Peta Leaflet (Default: Cikarang/PresUniv Area)
    setTimeout(() => {
        const map = L.map(mapId).setView([-6.2856, 107.1706], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Tambahkan Marker yang bisa digeser
        const marker = L.marker([-6.2856, 107.1706], { draggable: true }).addTo(map);

        marker.on('dragend', function (e) {
            const latlng = marker.getLatLng();
            // Update isi button konfirmasi di bubble chat secara dinamis atau simpan sementara
            window.tempLat = latlng.lat;
            window.tempLng = latlng.lng;
        });
    }, 100);
}

async function saveOrderToHistory() {
    if (cart.length === 0) return;

    try {
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const orderData = {
            items: cart,
            totalPrice: total,
            location: selectedLocation, // Mengambil data koordinat yang sudah dikonfirmasi
            status: "Paid",
            paymentMethod: "E-Wallet / Cash",
            timestamp: serverTimestamp()
        };

        await addDoc(collection(db, "orders"), orderData);

        appendMessage("✅ **Payment Successful!** Your order has been recorded in the history.");

        // Kosongkan keranjang setelah sukses
        cart = [];
        updateCartBadge();
    } catch (error) {
        console.error("Error saving history:", error);
        appendMessage("❌ Failed to save order history.");
    }
}
async function showHistory() {
    const { collection, query, getDocs, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
    
    appendMessage("🔎 Fetching your recent order history...");

    try {
        const q = query(collection(db, "orders"), orderBy("timestamp", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            appendMessage("No order history found yet.");
            return;
        }

        let historyHtml = `<div class="space-y-3 mt-2">`;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleString('en-US') || "Just now";
            
            historyHtml += `
                <div class="bg-white/5 border border-white/10 rounded-xl p-3 text-left">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] text-orange-400 font-bold uppercase tracking-wider">${data.status}</span>
                        <span class="text-[9px] text-gray-500">${date}</span>
                    </div>
                    <div class="text-xs text-gray-300 mb-2">
                        ${data.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </div>
                    <div class="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                        <span class="text-[10px] text-gray-400">Total Payment</span>
                        <span class="text-sm font-bold text-white">Rp ${data.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        
        historyHtml += `</div>`;
        appendMessage(`<b>Order History 🧾</b>${historyHtml}`);

    } catch (error) {
        console.error("Error fetching history:", error);
        appendMessage("Failed to load history. Please ensure you have set up the Index in the Firebase Console.");
    }
}
// Tambahkan baris ini di bagian paling bawah file WADJS.js
window.showHistory = showHistory;
window.trackLatestOrder = async function() {
    try {
        const { collection, query, orderBy, limit, getDocs, onSnapshot, doc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
        
        const q = query(collection(window.db, "orders"), orderBy("timestamp", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            appendMessage("🕵️‍♂️ You haven't placed any orders yet.");
            return;
        }

        const orderId = querySnapshot.docs[0].id;
        const containerId = "tracker-live-" + orderId;
        
        appendMessage(`🔍 <b>Live Order Status:</b>
            <div id="${containerId}" class="mt-2 text-sm text-gray-400">Connecting to live feed...</div>
        `);
        
        if (window.buyerTrackerUnsubscribe) window.buyerTrackerUnsubscribe();
        
        window.buyerTrackerUnsubscribe = onSnapshot(doc(db, "orders", orderId), (docSnap) => {
            if(!docSnap.exists()) return;
            const order = docSnap.data();
            const status = order.status || "Processing";
            
            const steps = ["Processing", "Preparing", "On the Way", "Delivered"];
            let currentIdx = steps.indexOf(status);
            if (currentIdx === -1) currentIdx = 0; 
            const progress = ((currentIdx + 1) / steps.length) * 100;
            
            // Map injection logic if on the way
            const showMap = status === "On the Way";
            const mapContainerId = "map-tracker-" + orderId;

            document.getElementById(containerId).innerHTML = `
                <div class="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-[280px]">
                    <div class="flex flex-col gap-1 mb-4">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Live Tracker 🛵</span>
                            <span class="text-[10px] text-gray-500">Order #${orderId.slice(0,5)}</span>
                        </div>
                    </div>
                    
                    <div class="relative h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
                        <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                    </div>

                    <div class="space-y-4 ${showMap ? 'mb-4' : ''}">
                        ${steps.map((step, idx) => `
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full flex items-center justify-center ${idx <= currentIdx ? 'bg-orange-500/20' : ''}">
                                     <div class="w-1.5 h-1.5 rounded-full ${idx <= currentIdx ? 'bg-orange-500 shadow-[0_0_8px_#ff6b00]' : 'bg-white/20'}"></div>
                                </div>
                                <span class="${idx <= currentIdx ? 'text-white font-bold' : 'text-gray-500'} text-xs tracking-wide">${step}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${showMap ? `
                        <div class="bg-black/40 px-3 py-2 rounded-xl mb-2 border border-white/10 flex justify-between items-center transition-all">
                            <div class="flex items-center gap-2">
                                <span class="bg-orange-500/20 text-orange-400 p-1.5 rounded-full text-[10px]">🛵</span>
                                <span class="text-[11px] font-bold text-white tracking-wide" id="eta-display-${orderId}">Menghitung ETA...</span>
                            </div>
                        </div>
                        <div id="${mapContainerId}" class="w-full h-32 rounded-xl bg-black/40 border border-white/10 mb-4 z-0 relative overflow-hidden"></div>
                    ` : ''}
                    
                    <button onclick="window.openBuyerChat('${orderId}')" class="w-full mt-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold py-2 rounded-xl text-xs hover:bg-orange-500/20 transition-all">
                        💬 Chat with Merchant
                    </button>
                </div>
            `;
            
            if (showMap) {
                // Initialize highly dynamic map tracking
                setTimeout(() => {
                    const driverLat = order.driverLat || -6.2849;
                    const driverLng = order.driverLng || 107.1706;
                    
                    const homeLat = order.location?.lat || -6.2856;
                    const homeLng = order.location?.lng || 107.1710;
                    
                    let map = window.buyerDeliveryMap;
                    
                    // Initialize Map & Markers if not exists or container empty
                    const container = document.getElementById(mapContainerId);
                    if (!map || (container && container.innerHTML === '')) {
                        if(map) map.remove();
                        map = L.map(mapContainerId, {zoomControl: false}).setView([driverLat, driverLng], 15);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                        
                        // Custom markers
                        const driverIcon = L.divIcon({className: 'bg-transparent', html: '<div class="text-xl">🛵</div>', iconSize: [24, 24]});
                        const homeIcon = L.divIcon({className: 'bg-transparent', html: '<div class="text-xl">🏠</div>', iconSize: [24, 24]});
                        
                        window.buyerDeliveryMarker = L.marker([driverLat, driverLng], {icon: driverIcon}).addTo(map);
                        window.buyerHomeMarker = L.marker([homeLat, homeLng], {icon: homeIcon}).addTo(map);
                        window.buyerRouteLine = L.polyline([[driverLat, driverLng], [homeLat, homeLng]], {color: '#ff6b00', weight: 3, dashArray: '5, 5'}).addTo(map);
                        window.buyerDeliveryMap = map;
                    } else {
                        // Update existing map
                        window.buyerDeliveryMarker.setLatLng([driverLat, driverLng]);
                        window.buyerHomeMarker.setLatLng([homeLat, homeLng]);
                        window.buyerRouteLine.setLatLngs([[driverLat, driverLng], [homeLat, homeLng]]);
                    }
                    
                    // Calculate ETA
                    const distMeters = map.distance([driverLat, driverLng], [homeLat, homeLng]);
                    const etaBox = document.getElementById(`eta-display-${orderId}`);
                    
                    if (distMeters < 50) {
                        etaBox.innerText = "Tiba di tujuan!";
                        etaBox.classList.add("text-green-400");
                    } else {
                        const speedKmh = 30; // 30 km/h avg speed
                        const mins = Math.max(1, Math.ceil((distMeters / ((speedKmh * 1000) / 60))));
                        const distKm = (distMeters / 1000).toFixed(1);
                        etaBox.innerText = `Arriving in ~${mins} min (${distKm} km)`;
                        etaBox.classList.remove("text-green-400");
                    }

                    // Auto-fit bounds so both markers are visible
                    const bounds = L.latLngBounds([[driverLat, driverLng], [homeLat, homeLng]]);
                    map.fitBounds(bounds, {padding: [15, 15]});
                    map.invalidateSize();
                }, 100);
            }
        });

    } catch (error) {
        console.error("Tracking Error:", error);
        appendMessage("❌ Could not retrieve tracking info. Please try again.");
    }
};

window.currentBuyerChatId = null;

window.openBuyerChat = function(orderId) {
    document.getElementById("buyerChatModal").classList.remove("hidden");
    document.getElementById("buyerChatOrderId").innerText = orderId.slice(0,5);
    window.currentBuyerChatId = orderId;
    
    if (window.buyerChatUnsubscribe) window.buyerChatUnsubscribe();
    import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js").then(({ doc, onSnapshot }) => {
        window.buyerChatUnsubscribe = onSnapshot(doc(window.db, "orders", orderId), (docSnap) => {
            if(!docSnap.exists()) return;
            const msgs = docSnap.data().chatMessages || [];
            const box = document.getElementById("buyerChatBody");
            box.innerHTML = msgs.map(m => `
                <div class="flex flex-col ${m.sender === 'buyer' ? 'items-end' : 'items-start'}">
                    <span class="text-[8px] text-gray-500 mb-0.5">${m.sender === 'buyer' ? 'YOU' : 'RESTAURANT'}</span>
                    <div class="px-3 py-2 rounded-xl max-w-[80%] text-sm ${m.sender === 'buyer' ? 'bg-orange-500 text-black rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}">
                        ${m.text}
                    </div>
                </div>
            `).join("");
            box.scrollTop = box.scrollHeight;
        });
    });
};

window.closeBuyerChat = function() {
    document.getElementById("buyerChatModal").classList.add("hidden");
};

window.sendBuyerChat = async function() {
    const input = document.getElementById("buyerChatInput");
    const val = input.value.trim();
    if(!val || !window.currentBuyerChatId) return;
    
    input.value = "";
    const { doc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
    await updateDoc(doc(window.db, "orders", window.currentBuyerChatId), {
        chatMessages: arrayUnion({ sender: 'buyer', text: val, time: Date.now() })
    });
};
// Add a button to jump to the seller page for testing
function showSellerLink() {
    appendMessage(`
        <div class="bg-white/5 p-3 rounded-xl border border-white/10">
            <p class="text-xs mb-2">Merchant Access:</p>
            <a href="seller.html" class="btn-pill btn-outline block text-center text-[10px]">
                Go to Seller Dashboard ➔
            </a>
        </div>
    `);
}

// You can trigger this by typing "admin" or "seller"
// Add this to your sendMessage logic
if (text === "admin" || text === "seller") {
    showSellerLink();
}