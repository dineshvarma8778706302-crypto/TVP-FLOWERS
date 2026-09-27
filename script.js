// --- FIREBASE SETUP ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvVAw401NS1PgQNItOeWmgw1BFVSis81U",
    authDomain: "tvp-flowers.firebaseapp.com",
    projectId: "tvp-flowers",
    storageBucket: "tvp-flowers.firebasestorage.app",
    messagingSenderId: "305890583563",
    appId: "1:305890583563:web:387bfcdcea353c77d7930e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CLOUD VARIABLES ---
let inventoryData = [];
let ordersData = [];

// --- 1. LOAD DATA FROM FIRESTORE (REAL-TIME) ---
function fetchInventory() {
    onSnapshot(collection(db, "inventory"), (querySnapshot) => {
        inventoryData = [];
        querySnapshot.forEach((doc) => {
            inventoryData.push({ id: doc.id, ...doc.data() });
        });
        loadTableData();
        updateDashboard();
    });
}

function fetchOrders() {
    onSnapshot(collection(db, "orders"), (querySnapshot) => {
        ordersData = [];
        querySnapshot.forEach((doc) => {
            ordersData.push({ id: doc.id, ...doc.data() });
        });
        loadOrdersData();
        updateDashboard();
    });
}

// Initial Data Fetch
fetchInventory();
fetchOrders();

// --- 2. DYNAMIC DASHBOARD CALCULATION ---
function updateDashboard() {
    let pendingCount = 0;
    for (let i = 0; i < ordersData.length; i++) {
        if (ordersData[i].status === 'Pending') pendingCount++;
    }

    let lowStockCount = 0;
    for (let i = 0; i < inventoryData.length; i++) {
        if (inventoryData[i].status === 'Low Stock' || inventoryData[i].status === 'Critical') {
            lowStockCount++;
        }
    }

    let totalRevenue = ordersData.length * 1500;

    const dashRevenue = document.getElementById('dash-revenue');
    const dashPending = document.getElementById('dash-pending');
    const dashLowStock = document.getElementById('dash-low-stock');

    if (dashRevenue) dashRevenue.innerText = "₹" + totalRevenue.toLocaleString('en-IN');
    if (dashPending) dashPending.innerText = pendingCount;
    if (dashLowStock) dashLowStock.innerText = lowStockCount + " Items";
}

// --- 3. LOAD TABLE FUNCTIONS ---
function loadTableData() {
    let htmlContent = '';
    for (let i = 0; i < inventoryData.length; i++) {
        htmlContent += `
            <tr>
                <td>${inventoryData[i].name}</td>
                <td>${inventoryData[i].quantity}</td>
                <td><span class="badge ${inventoryData[i].badgeClass}">${inventoryData[i].status}</span></td>
                <td>
                    <button class="edit-btn" onclick="window.openEditModal(${i})">Edit</button>
                    <button class="delete-btn" onclick="window.deleteFlower('${inventoryData[i].id}')">Delete</button>
                </td>
            </tr>
        `;
    }
    const inventoryBody = document.getElementById('inventory-body');
    if (inventoryBody) inventoryBody.innerHTML = htmlContent;
}

window.deleteFlower = async function (id) {
    if (confirm("Are you sure you want to delete this flower?")) {
        await deleteDoc(doc(db, "inventory", id));
    }
}

function loadOrdersData() {
    let htmlContent = '';
    for (let i = 0; i < ordersData.length; i++) {
        htmlContent += `
            <tr>
                <td><strong>${ordersData[i].orderId}</strong></td>
                <td>${ordersData[i].customer}</td>
                <td>${ordersData[i].items}</td>
                <td><span class="badge ${ordersData[i].badgeClass}">${ordersData[i].status}</span></td>
            </tr>
        `;
    }
    const ordersBody = document.getElementById('orders-body');
    if (ordersBody) ordersBody.innerHTML = htmlContent;
}


// --- 4. MODAL & FORM LOGIC (Add & Edit Flower) ---
const flowerModal = document.getElementById('add-flower-modal');
const addFlowerBtn = document.getElementById('add-flower-btn');
const closeFlowerBtn = document.querySelector('#add-flower-modal .close-btn');
const flowerForm = document.getElementById('add-flower-form');

if (addFlowerBtn) addFlowerBtn.onclick = function () { flowerModal.style.display = "flex"; }
if (closeFlowerBtn) closeFlowerBtn.onclick = function () { flowerModal.style.display = "none"; }

if (flowerForm) {
    flowerForm.onsubmit = async function (event) {
        event.preventDefault();
        const nameInput = document.getElementById('flower-name').value;
        const quantityInput = parseInt(document.getElementById('flower-quantity').value);
        const statusInput = document.getElementById('flower-status').value;

        let badgeColor = 'in-stock';
        if (statusInput === 'Low Stock') badgeColor = 'low-stock';
        if (statusInput === 'Critical') badgeColor = 'out-stock';

        await addDoc(collection(db, "inventory"), {
            name: nameInput,
            quantity: quantityInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        flowerModal.style.display = "none";
        flowerForm.reset();
    }
}

// Edit Form Logic
const editModal = document.getElementById('edit-flower-modal');
const editForm = document.getElementById('edit-flower-form');
const closeEditBtn = document.querySelector('.close-edit-btn');

window.openEditModal = function (index) {
    document.getElementById('edit-flower-index').value = inventoryData[index].id;
    document.getElementById('edit-flower-name').value = inventoryData[index].name;
    document.getElementById('edit-flower-quantity').value = inventoryData[index].quantity;
    document.getElementById('edit-flower-status').value = inventoryData[index].status;
    editModal.style.display = "flex";
}

if (closeEditBtn) closeEditBtn.onclick = function () { editModal.style.display = "none"; }

if (editForm) {
    editForm.onsubmit = async function (event) {
        event.preventDefault();
        const id = document.getElementById('edit-flower-index').value;
        const nameInput = document.getElementById('edit-flower-name').value;
        const quantityInput = parseInt(document.getElementById('edit-flower-quantity').value);
        const statusInput = document.getElementById('edit-flower-status').value;

        let badgeColor = 'in-stock';
        if (statusInput === 'Low Stock') badgeColor = 'low-stock';
        if (statusInput === 'Critical') badgeColor = 'out-stock';

        const flowerRef = doc(db, "inventory", id);
        await updateDoc(flowerRef, {
            name: nameInput,
            quantity: quantityInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        editModal.style.display = "none";
    }
}

// --- 5. MODAL & FORM LOGIC (Add Order) ---
const orderModal = document.getElementById('add-order-modal');
const addOrderBtn = document.getElementById('add-order-btn');
const closeOrderBtn = document.querySelector('#add-order-modal .close-btn');
const orderForm = document.getElementById('add-order-form');

if (addOrderBtn) addOrderBtn.onclick = function () { orderModal.style.display = "flex"; }
if (closeOrderBtn) closeOrderBtn.onclick = function () { orderModal.style.display = "none"; }

if (orderForm) {
    orderForm.onsubmit = async function (event) {
        event.preventDefault();
        const customerInput = document.getElementById('order-customer').value;
        const itemsInput = document.getElementById('order-items').value;
        const statusInput = document.getElementById('order-status').value;

        let badgeColor = 'low-stock';
        if (statusInput === 'Delivered') badgeColor = 'in-stock';
        if (statusInput === 'Cancelled') badgeColor = 'out-stock';

        const newOrderId = "#ORD-" + Math.floor(Math.random() * 900 + 100);

        for (let i = 0; i < inventoryData.length; i++) {
            if (itemsInput.toLowerCase().includes(inventoryData[i].name.toLowerCase())) {
                let match = itemsInput.match(/\d+/);
                let qtyToDeduct = match ? parseInt(match[0]) : 1;

                let newQty = inventoryData[i].quantity - qtyToDeduct;
                if (newQty < 0) newQty = 0;

                let newStatus = "In Stock";
                let newBadge = "in-stock";

                if (newQty === 0) {
                    newStatus = "Critical"; newBadge = "out-stock";
                } else if (newQty <= 5) {
                    newStatus = "Low Stock"; newBadge = "low-stock";
                }

                const flowerRef = doc(db, "inventory", inventoryData[i].id);
                await updateDoc(flowerRef, {
                    quantity: newQty,
                    status: newStatus,
                    badgeClass: newBadge
                });
            }
        }

        await addDoc(collection(db, "orders"), {
            orderId: newOrderId,
            customer: customerInput,
            items: itemsInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        orderModal.style.display = "none";
        orderForm.reset();
    }
}

window.onclick = function (event) {
    if (event.target == flowerModal) flowerModal.style.display = "none";
    if (event.target == orderModal) orderModal.style.display = "none";
    if (event.target == editModal) editModal.style.display = "none";
}

// --- 6. NAVIGATION & SEARCH LOGIC (UPDATED) ---
const menuDashboard = document.getElementById('menu-dashboard');
const menuInventory = document.getElementById('menu-inventory');
const menuOrders = document.getElementById('menu-orders');
const menuWedding = document.getElementById('menu-wedding');
const menuTemple = document.getElementById('menu-temple');

const dashboardSection = document.getElementById('dashboard-section');
const inventorySection = document.getElementById('inventory-section');
const ordersSection = document.getElementById('orders-section');
const weddingSection = document.getElementById('wedding-section');
const templeSection = document.getElementById('temple-section');

// Oru function ellathaiyum hide panna (Easy switching-ku)
function hideAllSections() {
    dashboardSection.style.display = "none";
    inventorySection.style.display = "none";
    ordersSection.style.display = "none";
    if (weddingSection) weddingSection.style.display = "none";
    if (templeSection) templeSection.style.display = "none";

    menuDashboard.style.fontWeight = "500";
    menuInventory.style.fontWeight = "500";
    menuOrders.style.fontWeight = "500";
    if (menuWedding) menuWedding.style.fontWeight = "500";
    if (menuTemple) menuTemple.style.fontWeight = "500";
}

if (menuDashboard) {
    menuDashboard.onclick = function () {
        hideAllSections();
        dashboardSection.style.display = "block"; // Illa unga pazhaya padi flex iruntha flex podunga
        menuDashboard.style.fontWeight = "bold";
    }
}
if (menuInventory) {
    menuInventory.onclick = function () {
        hideAllSections();
        inventorySection.style.display = "block";
        menuInventory.style.fontWeight = "bold";
    }
}
if (menuOrders) {
    menuOrders.onclick = function () {
        hideAllSections();
        ordersSection.style.display = "block";
        menuOrders.style.fontWeight = "bold";
    }
}
if (menuWedding) {
    menuWedding.onclick = function () {
        hideAllSections();
        weddingSection.style.display = "block";
        menuWedding.style.fontWeight = "bold";
    }
}
if (menuTemple) {
    menuTemple.onclick = function () {
        hideAllSections();
        templeSection.style.display = "block";
        menuTemple.style.fontWeight = "bold";
    }
}

// Pazhaya Search & Export logic inga thodaralaam...
window.searchInventory = function () {
    const input = document.getElementById("search-bar").value.toLowerCase();
    const tableBody = document.getElementById("inventory-body");
    if (!tableBody) return;
    const rows = tableBody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        const flowerName = rows[i].getElementsByTagName("td")[0].innerText.toLowerCase();
        if (flowerName.includes(input)) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}
// ... (exportToCSV functions continue down here)
// --- 7. ADMIN LOGIN LOGIC ---
window.checkLogin = function () {
    const pass = document.getElementById("admin-pass").value;

    if (pass === "admin123") {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("main-app").style.display = "flex";
    } else {
        const errorMsg = document.getElementById("login-error");
        if (errorMsg) errorMsg.style.display = "block";
    }
}
// --- 8. WEDDING & TEMPLE MODALS (OPEN & CLOSE LOGIC) ---
const weddingModal = document.getElementById('add-wedding-modal');
const addWeddingBtn = document.getElementById('add-wedding-btn');
const closeWeddingBtn = document.getElementById('close-wedding-btn');

const templeModal = document.getElementById('add-temple-modal');
const addTempleBtn = document.getElementById('add-temple-btn');
const closeTempleBtn = document.getElementById('close-temple-btn');

// Open Modals
if (addWeddingBtn) addWeddingBtn.onclick = function () { weddingModal.style.display = "flex"; }
if (addTempleBtn) addTempleBtn.onclick = function () { templeModal.style.display = "flex"; }

// Close Modals
if (closeWeddingBtn) closeWeddingBtn.onclick = function () { weddingModal.style.display = "none"; }
if (closeTempleBtn) closeTempleBtn.onclick = function () { templeModal.style.display = "none"; }

// Modal-ku veliya click panna close aaga
window.onclick = function (event) {
    if (event.target == document.getElementById('add-flower-modal')) document.getElementById('add-flower-modal').style.display = "none";
    if (event.target == document.getElementById('add-order-modal')) document.getElementById('add-order-modal').style.display = "none";
    if (event.target == document.getElementById('edit-flower-modal')) document.getElementById('edit-flower-modal').style.display = "none";
    if (event.target == weddingModal) weddingModal.style.display = "none";
    if (event.target == templeModal) templeModal.style.display = "none";
}
// --- 9. FIREBASE SAVE & LOAD (WEDDING & TEMPLE) ---

// Arrays to store data
let weddingData = [];
let templeData = [];

// --- SAVE WEDDING ORDER ---
const weddingForm = document.getElementById('add-wedding-form');
if (weddingForm) {
    weddingForm.onsubmit = async function (event) {
        event.preventDefault(); // Ithu thaan page refresh aaguratha thadukkum!

        const customer = document.getElementById('wedding-customer').value;
        const date = document.getElementById('wedding-date').value;
        const total = parseInt(document.getElementById('wedding-total').value);
        const advance = parseInt(document.getElementById('wedding-advance').value);
        const status = document.getElementById('wedding-status').value;

        let badgeColor = 'low-stock';
        if (status === 'Completed') badgeColor = 'in-stock';
        if (status === 'Confirmed') badgeColor = 'out-stock';

        // Saving to Firebase
        await addDoc(collection(db, "wedding_orders"), {
            customer: customer,
            date: date,
            total: total,
            advance: advance,
            status: status,
            badgeClass: badgeColor
        });

        document.getElementById('add-wedding-modal').style.display = "none";
        weddingForm.reset(); // Form-a clear pandrathu
    }
}

// --- SAVE TEMPLE DELIVERY ---
const templeForm = document.getElementById('add-temple-form');
if (templeForm) {
    templeForm.onsubmit = async function (event) {
        event.preventDefault(); // Page refresh stop

        const name = document.getElementById('temple-name').value;
        const details = document.getElementById('temple-details').value;
        const time = document.getElementById('temple-time').value;
        const status = document.getElementById('temple-status').value;

        let badgeColor = 'low-stock';
        if (status === 'Delivered') badgeColor = 'in-stock';

        // Saving to Firebase
        await addDoc(collection(db, "temple_deliveries"), {
            name: name,
            details: details,
            time: time,
            status: status,
            badgeClass: badgeColor
        });

        document.getElementById('add-temple-modal').style.display = "none";
        templeForm.reset();
    }
}

// --- FETCH & DISPLAY DATA REAL-TIME ---
function fetchWeddingOrders() {
    onSnapshot(collection(db, "wedding_orders"), (querySnapshot) => {
        weddingData = [];
        let htmlContent = '';
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            weddingData.push({ id: doc.id, ...data });
            htmlContent += `
                <tr>
                    <td><strong>${data.customer}</strong></td>
                    <td>${data.date}</td>
                    <td>₹${data.total.toLocaleString('en-IN')}</td>
                    <td>₹${data.advance.toLocaleString('en-IN')}</td>
                    <td><span class="badge ${data.badgeClass}">${data.status}</span></td>
                </tr>
            `;
        });
        const tbody = document.getElementById('wedding-body');
        if (tbody) tbody.innerHTML = htmlContent;
    });
}

function fetchTempleDeliveries() {
    onSnapshot(collection(db, "temple_deliveries"), (querySnapshot) => {
        templeData = [];
        let htmlContent = '';
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            templeData.push({ id: doc.id, ...data });
            htmlContent += `
                <tr>
                    <td><strong>${data.name}</strong></td>
                    <td>${data.details}</td>
                    <td>${data.time}</td>
                    <td><span class="badge ${data.badgeClass}">${data.status}</span></td>
                </tr>
            `;
        });
        const tbody = document.getElementById('temple-body');
        if (tbody) tbody.innerHTML = htmlContent;
    });
}

// App open aagum pothu data-va load panna
fetchWeddingOrders();
fetchTempleDeliveries();