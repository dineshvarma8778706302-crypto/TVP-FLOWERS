// --- 1. DATA SECTIONS (With Local Storage) ---
const defaultInventory = [
    { name: "Red Roses", quantity: 45, status: "In Stock", badgeClass: "in-stock" },
    { name: "White Lilies", quantity: 8, status: "Low Stock", badgeClass: "low-stock" },
    { name: "Orchids", quantity: 2, status: "Critical", badgeClass: "out-stock" },
    { name: "Sunflowers", quantity: 25, status: "In Stock", badgeClass: "in-stock" }
];

const defaultOrders = [
    { id: "#ORD-101", customer: "Vijay", items: "Red Roses 5", status: "Delivered", badgeClass: "in-stock" },
    { id: "#ORD-102", customer: "Ajith", items: "White Lilies 2", status: "Pending", badgeClass: "low-stock" },
    { id: "#ORD-103", customer: "Surya", items: "Orchids 1", status: "Cancelled", badgeClass: "out-stock" }
];

let inventoryData = JSON.parse(localStorage.getItem('tvp_inventory')) || defaultInventory;
let ordersData = JSON.parse(localStorage.getItem('tvp_orders')) || defaultOrders;

function saveToLocalStorage() {
    localStorage.setItem('tvp_inventory', JSON.stringify(inventoryData));
    localStorage.setItem('tvp_orders', JSON.stringify(ordersData));
    updateDashboard();
}

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
                    <button class="edit-btn" onclick="openEditModal(${i})">Edit</button>
                    <button class="delete-btn" onclick="deleteFlower(${i})">Delete</button>
                </td>
            </tr>
        `;
    }
    const inventoryBody = document.getElementById('inventory-body');
    if (inventoryBody) inventoryBody.innerHTML = htmlContent;
}

function deleteFlower(index) {
    if (confirm("Are you sure you want to delete this flower?")) {
        inventoryData.splice(index, 1);
        saveToLocalStorage();
        loadTableData();
    }
}

function loadOrdersData() {
    let htmlContent = '';
    for (let i = 0; i < ordersData.length; i++) {
        htmlContent += `
            <tr>
                <td><strong>${ordersData[i].id}</strong></td>
                <td>${ordersData[i].customer}</td>
                <td>${ordersData[i].items}</td>
                <td><span class="badge ${ordersData[i].badgeClass}">${ordersData[i].status}</span></td>
            </tr>
        `;
    }
    const ordersBody = document.getElementById('orders-body');
    if (ordersBody) ordersBody.innerHTML = htmlContent;
}

loadTableData();
loadOrdersData();
updateDashboard();

// --- 4. MODAL & FORM LOGIC (Add & Edit Flower) ---
const flowerModal = document.getElementById('add-flower-modal');
const addFlowerBtn = document.getElementById('add-flower-btn');
const closeFlowerBtn = document.querySelector('#add-flower-modal .close-btn');
const flowerForm = document.getElementById('add-flower-form');

if (addFlowerBtn) addFlowerBtn.onclick = function () { flowerModal.style.display = "flex"; }
if (closeFlowerBtn) closeFlowerBtn.onclick = function () { flowerModal.style.display = "none"; }

if (flowerForm) {
    flowerForm.onsubmit = function (event) {
        event.preventDefault();
        const nameInput = document.getElementById('flower-name').value;
        const quantityInput = document.getElementById('flower-quantity').value;
        const statusInput = document.getElementById('flower-status').value;

        let badgeColor = 'in-stock';
        if (statusInput === 'Low Stock') badgeColor = 'low-stock';
        if (statusInput === 'Critical') badgeColor = 'out-stock';

        inventoryData.push({
            name: nameInput,
            quantity: quantityInput,
            status: statusInput,
            badgeClass: badgeColor
        });

        saveToLocalStorage();
        loadTableData();
        flowerModal.style.display = "none";
        flowerForm.reset();
    }
}

// Edit Form Logic
const editModal = document.getElementById('edit-flower-modal');
const editForm = document.getElementById('edit-flower-form');
const closeEditBtn = document.querySelector('.close-edit-btn');

function openEditModal(index) {
    document.getElementById('edit-flower-index').value = index;
    document.getElementById('edit-flower-name').value = inventoryData[index].name;
    document.getElementById('edit-flower-quantity').value = inventoryData[index].quantity;
    document.getElementById('edit-flower-status').value = inventoryData[index].status;
    editModal.style.display = "flex";
}

if (closeEditBtn) closeEditBtn.onclick = function () { editModal.style.display = "none"; }

if (editForm) {
    editForm.onsubmit = function (event) {
        event.preventDefault();
        const index = document.getElementById('edit-flower-index').value;
        const nameInput = document.getElementById('edit-flower-name').value;
        const quantityInput = document.getElementById('edit-flower-quantity').value;
        const statusInput = document.getElementById('edit-flower-status').value;

        let badgeColor = 'in-stock';
        if (statusInput === 'Low Stock') badgeColor = 'low-stock';
        if (statusInput === 'Critical') badgeColor = 'out-stock';

        inventoryData[index] = { name: nameInput, quantity: quantityInput, status: statusInput, badgeClass: badgeColor };
        saveToLocalStorage();
        loadTableData();
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
    orderForm.onsubmit = function (event) {
        event.preventDefault();
        const customerInput = document.getElementById('order-customer').value;
        const itemsInput = document.getElementById('order-items').value;
        const statusInput = document.getElementById('order-status').value;

        let badgeColor = 'low-stock';
        if (statusInput === 'Delivered') badgeColor = 'in-stock';
        if (statusInput === 'Cancelled') badgeColor = 'out-stock';

        const newOrderId = "#ORD-" + Math.floor(Math.random() * 900 + 100);

        // --- SMART LOGIC: Auto-Stock Deduction ---
        // Neenga type panna text-a vachu inventory-la thedi stock-a kuraiyum
        for (let i = 0; i < inventoryData.length; i++) {
            // Text-la flower name irukka nu check pandrom (e.g., "Red Roses")
            if (itemsInput.toLowerCase().includes(inventoryData[i].name.toLowerCase())) {

                // Text-la irukka number-a (quantity) regex moolama edukkurom
                let match = itemsInput.match(/\d+/);
                let qtyToDeduct = match ? parseInt(match[0]) : 1;

                // Stock-a kurairom
                inventoryData[i].quantity -= qtyToDeduct;
                if (inventoryData[i].quantity < 0) inventoryData[i].quantity = 0; // 0 ku keela poga koodathu

                // Status-a thaana update pandrom
                if (inventoryData[i].quantity === 0) {
                    inventoryData[i].status = "Critical";
                    inventoryData[i].badgeClass = "out-stock";
                } else if (inventoryData[i].quantity <= 5) {
                    inventoryData[i].status = "Low Stock";
                    inventoryData[i].badgeClass = "low-stock";
                } else {
                    inventoryData[i].status = "In Stock";
                    inventoryData[i].badgeClass = "in-stock";
                }
            }
        }
        // --- SMART LOGIC END ---

        ordersData.push({ id: newOrderId, customer: customerInput, items: itemsInput, status: statusInput, badgeClass: badgeColor });

        saveToLocalStorage();
        loadOrdersData();
        loadTableData(); // Inventory table-ayum refresh pandrom
        orderModal.style.display = "none";
        orderForm.reset();
    }
}

window.onclick = function (event) {
    if (event.target == flowerModal) flowerModal.style.display = "none";
    if (event.target == orderModal) orderModal.style.display = "none";
    if (event.target == editModal) editModal.style.display = "none";
}

// --- 6. NAVIGATION TAB LOGIC ---
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
// --- 7. SEARCH FILTER LOGIC ---
function searchInventory() {
    // Search box-la type pandra ezhuthukalai edukkurom (ellam small letters-a maathi)
    const input = document.getElementById("search-bar").value.toLowerCase();

    // Table-la irukka ellla varisaikalaiyum (rows) edukkurom
    const tableBody = document.getElementById("inventory-body");
    const rows = tableBody.getElementsByTagName("tr");

    // Ovvoru row-aai check pandrom
    for (let i = 0; i < rows.length; i++) {
        // Mudhal column (0) la thaan poovoda peru irukku
        const flowerName = rows[i].getElementsByTagName("td")[0].innerText.toLowerCase();

        // Search pandra ezhuthu antha perula irukka nu check pandrom
        if (flowerName.includes(input)) {
            rows[i].style.display = ""; // Iruntha antha row-a display pannu
        } else {
            rows[i].style.display = "none"; // Illana antha row-a maraichidu
        }
    }
}
// --- 8. EXPORT TO CSV LOGIC ---
function exportToCSV() {
    // CSV file-oda mudhal line (Headers)
    let csvContent = "data:text/csv;charset=utf-8,Flower Type,Quantity (Bunches),Status\n";

    // Table-la irukka data-va comma pottu add pandrom
    for (let i = 0; i < inventoryData.length; i++) {
        let row = inventoryData[i].name + "," + inventoryData[i].quantity + "," + inventoryData[i].status;
        csvContent += row + "\n";
    }

    // Download pandrathukaana magic logic
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tvp_inventory_report.csv"); // Download aagum file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}