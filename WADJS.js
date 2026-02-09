// ===============================
// GLOBAL CART
// ===============================
let cart = [];
let menuData = [];

// ===============================
// FIRESTORE IMPORT (DYNAMIC)
// ===============================
let db;
window.addEventListener("load", async () => {
    db = window.db;
    loadMenuRealtime();
});

// ===============================
// REALTIME MENU FROM FIRESTORE
// ===============================
async function loadMenuRealtime() {
    const { collection, onSnapshot } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");

    const q = collection(db, "products");

    onSnapshot(q, (snapshot) => {
        menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("🔥 Live menu update:", menuData);
    });
}

// ===============================
// CHAT MESSAGE UI (MATCH YOUR UI)
// ===============================
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

// ===============================
// ADD TO CART + UPDATE STOCK
// ===============================
async function addToCart(id, qty = 1) {
    const item = menuData.find(m => m.id === id);
    if (!item) return;

    if (item.stock < qty) {
        appendMessage(`⚠️ Sorry, ${item.name} is out of stock (Left: ${item.stock})`);
        return;
    }

    // Update stock in Firestore
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
    const ref = doc(db, "products", id);
    await updateDoc(ref, { stock: item.stock - qty });

    // Add to cart
    const existing = cart.find(c => c.id === id);
    if (existing) existing.quantity += qty;
    else cart.push({ id, name: item.name, price: item.price, quantity: qty });

    updateCartBadge();
    appendMessage(`✅ Added ${qty} ${item.name} to cart`);
}

// ===============================
// CART FLOAT BADGE
// ===============================
function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    document.getElementById("cart-count").innerText = count;
    document.getElementById("cart-trigger").classList.toggle("hidden", count === 0);
}

// ===============================
// CHATBOT INPUT
// ===============================
window.sendMessage = function () {
    const input = document.getElementById("userInput");
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, false);
    const text = msg.toLowerCase();

    // MENU REQUEST
    if (text.includes("menu") || text.includes("food")) {
        appendMessage("Here is today’s menu:");
        menuData.forEach(m => {
            appendMessage(`${m.emoji || "🍛"} ${m.name} - Rp ${m.price} (Stock: ${m.stock})`);
        });
    }
    // CATEGORY RECOMMENDATION (SWEET, SPICY, CHEAP, ETC)
    const tags = ["sweet", "spicy", "cheap", "savory", "snack", "drink"];

    const detectedTags = tags.filter(tag => text.includes(tag));

    if (detectedTags.length > 0) {
        appendMessage(`Here are ${detectedTags.join(", ")} recommendations:`);

        const results = menuData.filter(item =>
            detectedTags.some(tag => item.tags?.includes(tag))
        );

        if (results.length === 0) {
            appendMessage("No items found in this category.");
        } else {
            results.forEach(item => {
                appendMessage(`${item.emoji || "🍛"} ${item.name} - Rp ${item.price} (Stock: ${item.stock})`);
            });
        }
    }

    
    // CART REQUEST
    else if (text.includes("cart")) {
        if (cart.length === 0) {
            appendMessage("Your cart is empty.");
        } else {
            cart.forEach(c => appendMessage(`${c.name} x${c.quantity}`));
        }
    }

    // BUY COMMAND (EX: buy bakso)
    else if (text.startsWith("buy ")) {
        const name = text.replace("buy ", "").trim();
        const item = menuData.find(m => m.name.toLowerCase().includes(name));
        if (item) addToCart(item.id, 1);
        else appendMessage("Item not found.");
    }

    else {
        appendMessage("Try: 'menu', 'buy bakso', or 'cart'.");
    }

    input.value = "";
};

// ENTER KEY
window.handleEnter = function(e) {
    if (e.key === "Enter") sendMessage();
};
