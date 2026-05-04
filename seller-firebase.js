        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
        import { getFirestore, collection, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
        import { firebaseConfig } from "./firebase-config.js";

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        window.db = db;

        // Save new menu to Firestore
        window.saveMenuToFirestore = async function(item) {
        await addDoc(collection(db, "products"), item);
        };

        // Update stock
        window.updateStockFirestore = async function(id, stock) {
        await updateDoc(doc(db, "products", id), { stock });
        };
