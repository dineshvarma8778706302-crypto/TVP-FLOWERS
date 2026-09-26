// --- FIREBASE SETUP ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
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

// --- 1. LOAD DATA FROM FIRESTORE ---
function fetchInventory() {
    // onSnapshot pottathala ippo auto-update aagum (Refresh thevaiyilla)
    onSnapshot(collection(db, "inventory"), (querySnapshot) => {
        inventoryData = [];
        querySnapshot.forEach((doc) => {
            inventoryData.push({ id: doc.id, ...doc.data() });
        });
        loadTableData();
        updateDashboard();
    });
}
async function fetchOrders() {

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
        fetchInventory(); // Refresh data from cloud
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

        // ADD TO CLOUD DATABASE
        await addDoc(collection(db, "inventory"), {
            name: nameInput,
            quantity: quantityInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        fetchInventory(); // Refresh from cloud
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

        // UPDATE IN CLOUD DATABASE
        const flowerRef = doc(db, "inventory", id);
        await updateDoc(flowerRef, {
            name: nameInput,
            quantity: quantityInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        fetchInventory();
        editModal.style.display = "none";
    }
}

// --- 5. MODAL & FORM LOGIC (Add Order WITH SMART DEDUCTION) ---
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

        // --- SMART LOGIC: Auto-Stock Deduction (Cloud Version) ---
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

                // Update stock in cloud
                const flowerRef = doc(db, "inventory", inventoryData[i].id);
                await updateDoc(flowerRef, {
                    quantity: newQty,
                    status: newStatus,
                    badgeClass: newBadge
                });
            }
        }

        // Add Order to cloud
        await addDoc(collection(db, "orders"), {
            orderId: newOrderId,
            customer: customerInput,
            items: itemsInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        fetchOrders();
        fetchInventory();
        orderModal.style.display = "none";
        orderForm.reset();
    }
}

window.onclick = function (event) {
    if (event.target == flowerModal) flowerModal.style.display = "none";
    if (event.target == orderModal) orderModal.style.display = "none";
    if (event.target == editModal) editModal.style.display = "none";
}

// --- 6. NAVIGATION & SEARCH LOGIC ---
const menuDashboard = document.getElementById('menu-dashboard');
const menuInventory = document.getElementById('menu-inventory');
const menuOrders = document.getElementById('menu-orders');
const dashboardSection = document.getElementById('dashboard-section');
const inventorySection = document.getElementById('inventory-section');
const ordersSection = document.getElementById('orders-section');

if (menuDashboard) {
    menuDashboard.onclick = function () {
        dashboardSection.style.display = "flex"; inventorySection.style.display = "none"; ordersSection.style.display = "none";
        menuDashboard.style.fontWeight = "bold"; menuInventory.style.fontWeight = "normal"; menuOrders.style.fontWeight = "normal";
    }
}
if (menuInventory) {
    menuInventory.onclick = function () {
        dashboardSection.style.display = "none"; inventorySection.style.display = "block"; ordersSection.style.display = "none";
        menuDashboard.style.fontWeight = "normal"; menuInventory.style.fontWeight = "bold"; menuOrders.style.fontWeight = "normal";
    }
}
if (menuOrders) {
    menuOrders.onclick = function () {
        dashboardSection.style.display = "none"; inventorySection.style.display = "none"; ordersSection.style.display = "block";
        menuDashboard.style.fontWeight = "normal"; menuInventory.style.fontWeight = "normal"; menuOrders.style.fontWeight = "bold";
    }
}

window.searchInventory = function () {
    const input = document.getElementById("search-bar").value.toLowerCase();
    const tableBody = document.getElementById("inventory-body");
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

window.exportToCSV = function () {
    let csvContent = "data:text/csv;charset=utf-8,Flower Type,Quantity (Bunches),Status\n";
    for (let i = 0; i < inventoryData.length; i++) {
        let row = inventoryData[i].name + "," + inventoryData[i].quantity + "," + inventoryData[i].status;
        csvContent += row + "\n";
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tvp_inventory_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}