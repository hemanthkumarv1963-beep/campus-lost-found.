
// =====================================
// CAMPUS LOST AND FOUND MANAGEMENT
// =====================================

let items = JSON.parse(localStorage.getItem("campusItems")) || [];
let claims = JSON.parse(localStorage.getItem("campusClaims")) || [];

function saveData() {
    localStorage.setItem("campusItems", JSON.stringify(items));
    localStorage.setItem("campusClaims", JSON.stringify(claims));
}

// Safely display user-submitted text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// =====================================
// PAGE NAVIGATION
// =====================================

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(page).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.page === page
        );
    });

    renderAll();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        showPage(btn.dataset.page);
    });
});

// =====================================
// NOTIFICATION
// =====================================

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// =====================================
// REPORT LOST OR FOUND ITEM
// =====================================

document.getElementById("reportForm").addEventListener(
    "submit",
    async function(event) {

    event.preventDefault();

    const file = document.getElementById("itemImage").files[0];

    if (file && file.size > 1024 * 1024) {
        showToast("Image must be smaller than 1 MB.");
        return;
    }

    let image = "";

    if (file) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            showToast("Please select a JPG, PNG or WebP image.");
            return;
        }

        image = await readImage(file);
    }

    const newItem = {
        id: Date.now().toString(),
        type: document.getElementById("itemType").value,
        name: document.getElementById("itemName").value.trim(),
        category: document.getElementById("itemCategory").value,
        location: document.getElementById("itemLocation").value.trim(),
        date: document.getElementById("itemDate").value,
        student: document.getElementById("studentName").value.trim(),
        email: document.getElementById("studentEmail").value.trim(),
        phone: document.getElementById("studentPhone").value.trim(),
        description: document.getElementById("itemDescription").value.trim(),
        image: image,
        status: "Active",
        createdAt: new Date().toISOString()
    };

    if (!newItem.name || !newItem.student || !newItem.email) {
        showToast("Please complete all required fields.");
        return;
    }

    items.unshift(newItem);

    saveData();

    this.reset();

    showToast("Item reported successfully!");

    showPage("dashboard");
});

// Convert uploaded image into a data URL
function readImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

// =====================================
// ITEM CARD
// =====================================

function createItemCard(item) {

    const badge = item.type === "Lost" ? "lost" : "found";

    const imageHTML = item.image
        ? `<img class="item-image" src="${escapeHTML(item.image)}" alt="Item image">`
        : `<div class="image-placeholder">📦</div>`;

    return `
        <div class="item-card">
            ${imageHTML}

            <div class="item-info">
                <span class="tag ${badge}">
                    ${escapeHTML(item.type)}
                </span>

                <h3>${escapeHTML(item.name)}</h3>

                <p>📍 ${escapeHTML(item.location)}</p>
                <p>📂 ${escapeHTML(item.category)}</p>
                <p>📅 ${escapeHTML(item.date)}</p>

                <div class="item-actions">
                    <button class="small-btn"
                        onclick="viewDetails('${item.id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =====================================
// RENDER ITEMS
// =====================================

function renderItems(type, containerId, search = "", category = "") {

    const container = document.getElementById(containerId);

    const filtered = items.filter(item => {

        const matchesType = item.type === type;

        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.location.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            !category || item.category === category;

        return matchesType &&
            matchesSearch &&
            matchesCategory &&
            item.status === "Active";
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h2>🔍 No Items Found</h2>
                <p>There are currently no matching items.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(createItemCard).join("");
}

// =====================================
// SEARCH AND FILTER
// =====================================

document.getElementById("lostSearch").addEventListener("input", function() {
    renderItems(
        "Lost",
        "lostItems",
        this.value,
        document.getElementById("lostCategory").value
    );
});

document.getElementById("lostCategory").addEventListener("change", function() {
    renderItems(
        "Lost",
        "lostItems",
        document.getElementById("lostSearch").value,
        this.value
    );
});

document.getElementById("foundSearch").addEventListener("input", function() {
    renderItems(
        "Found",
        "foundItems",
        this.value,
        document.getElementById("foundCategory").value
    );
});

document.getElementById("foundCategory").addEventListener("change", function() {
    renderItems(
        "Found",
        "foundItems",
        document.getElementById("foundSearch").value,
        this.value
    );
});

// =====================================
// VIEW ITEM DETAILS
// =====================================

function viewDetails(id) {

    const item = items.find(i => i.id === id);

    if (!item) return;

    const imageHTML = item.image
        ? `<img src="${escapeHTML(item.image)}" alt="Item photo">`
        : "";

    document.getElementById("modalBody").innerHTML = `
        ${imageHTML}

        <span class="tag ${item.type.toLowerCase()}">
            ${escapeHTML(item.type)}
        </span>

        <h2>${escapeHTML(item.name)}</h2>

        <p><b>Category:</b> ${escapeHTML(item.category)}</p>
        <p><b>Location:</b> ${escapeHTML(item.location)}</p>
        <p><b>Date:</b> ${escapeHTML(item.date)}</p>
        <p><b>Description:</b> ${escapeHTML(item.description)}</p>
        <p><b>Reported by:</b> ${escapeHTML(item.student)}</p>
        <p><b>Contact email:</b> ${escapeHTML(item.email)}</p>
        <p><b>Status:</b> ${escapeHTML(item.status)}</p>

        ${
            item.type === "Found" && item.status === "Active"
            ? `<button class="primary-btn full"
                onclick="submitClaim('${item.id}')">
                Claim This Item
               </button>`
            : ""
        }
    `;

    document.getElementById("detailsModal").classList.add("show");
}

function closeModal() {
    document.getElementById("detailsModal").classList.remove("show");
}

document.getElementById("detailsModal").addEventListener("click", function(event) {
    if (event.target === this) closeModal();
});

// =====================================
// SUBMIT CLAIM
// =====================================

function submitClaim(itemId) {

    const item = items.find(i => i.id === itemId);

    if (!item || item.status !== "Active") {
        showToast("This item is no longer available.");
        closeModal();
        return;
    }

    const email = prompt("Enter your student email address:");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        showToast("Please enter a valid email address.");
        return;
    }

    const existingClaim = claims.find(claim =>
        claim.itemId === itemId &&
        claim.email.toLowerCase() === email.trim().toLowerCase() &&
        claim.status === "Pending"
    );

    if (existingClaim) {
        showToast("You already have a pending claim.");
        return;
    }

    claims.unshift({
        id: Date.now().toString(),
        itemId: itemId,
        itemName: item.name,
        email: email.trim(),
        status: "Pending",
        date: new Date().toLocaleDateString()
    });

    saveData();

    closeModal();
    renderAll();

    showToast("Claim submitted successfully!");
}

// =====================================
// MY CLAIMS
// =====================================

function renderClaims() {

    const container = document.getElementById("claimsList");

    if (claims.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <h2>📩 No Claims Yet</h2>
                <p>Your submitted claims will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = claims.map(claim => `
        <div class="claim-card">
            <h3>${escapeHTML(claim.itemName)}</h3>
            <p>Email: ${escapeHTML(claim.email)}</p>
            <p>Submitted: ${escapeHTML(claim.date)}</p>
            <p>Status: <span class="status">
                ${escapeHTML(claim.status)}
            </span></p>
        </div>
    `).join("");
}

// =====================================
// ADMIN PANEL - ITEMS
// =====================================

function renderAdmin() {

    const tbody = document.getElementById("adminItems");

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No items available.</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${escapeHTML(item.type)}</td>
                <td>${escapeHTML(item.location)}</td>
                <td>${escapeHTML(item.status)}</td>
                <td>
                    ${
                        item.status === "Active"
                        ? `<button class="small-btn"
                            onclick="markReturned('${item.id}')">
                            Mark Returned
                           </button>`
                        : ""
                    }

                    <button class="small-btn"
                        onclick="deleteItem('${item.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
    }

    renderAdminClaims();
}

// =====================================
// MARK ITEM RETURNED
// =====================================

function markReturned(id) {

    const item = items.find(i => i.id === id);

    if (!item) return;

    item.status = "Returned";

    saveData();
    renderAll();

    showToast("Item marked as returned!");
}

// =====================================
// DELETE ITEM
// =====================================

function deleteItem(id) {

    if (!confirm("Are you sure you want to delete this item?")) {
        return;
    }

    items = items.filter(item => item.id !== id);

    // Remove claims associated with this item
    claims = claims.filter(claim => claim.itemId !== id);

    saveData();
    renderAll();

    showToast("Item deleted successfully.");
}

// =====================================
// ADMIN - MANAGE CLAIMS
// =====================================

function renderAdminClaims() {

    const container = document.getElementById("adminClaims");

    if (claims.length === 0) {
        container.innerHTML = `
            <div class="empty">No claims submitted yet.</div>
        `;
        return;
    }

    container.innerHTML = claims.map(claim => `
        <div class="claim-card">
            <h3>${escapeHTML(claim.itemName)}</h3>
            <p>Student email: ${escapeHTML(claim.email)}</p>
            <p>Status: <b>${escapeHTML(claim.status)}</b></p>

            ${
                claim.status === "Pending"
                ? `
                    <button class="small-btn"
                        onclick="updateClaim('${claim.id}', 'Approved')">
                        Approve
                    </button>

                    <button class="small-btn"
                        onclick="updateClaim('${claim.id}', 'Rejected')">
                        Reject
                    </button>
                `
                : ""
            }
        </div>
    `).join("");
}

function updateClaim(id, status) {

    const claim = claims.find(c => c.id === id);

    if (!claim) return;

    claim.status = status;

    if (status === "Approved") {
        const item = items.find(i => i.id === claim.itemId);

        if (item) {
            item.status = "Returned";
        }
    }

    saveData();
    renderAll();

    showToast("Claim " + status.toLowerCase() + "!");
}

// =====================================
// DASHBOARD STATISTICS
// =====================================

function renderDashboard() {

    const lost = items.filter(i =>
        i.type === "Lost" && i.status === "Active"
    ).length;

    const found = items.filter(i =>
        i.type === "Found" && i.status === "Active"
    ).length;

    const returned = items.filter(i =>
        i.status === "Returned"
    ).length;

    const pending = claims.filter(c =>
        c.status === "Pending"
    ).length;

    document.getElementById("totalLost").textContent = lost;
    document.getElementById("totalFound").textContent = found;
    document.getElementById("totalReturned").textContent = returned;
    document.getElementById("totalClaims").textContent = pending;

    const recent = items
        .filter(item => item.status === "Active")
        .slice(0, 6);

    const container = document.getElementById("recentItems");

    container.innerHTML = recent.length
        ? recent.map(createItemCard).join("")
        : `<div class="empty">
            <h2>Welcome to CampusFind!</h2>
            <p>No reports yet. Start by reporting a lost or found item.</p>
           </div>`;
}

// =====================================
// RENDER EVERYTHING
// =====================================

function renderAll() {

    renderDashboard();

    renderItems(
        "Lost",
        "lostItems",
        document.getElementById("lostSearch").value,
        document.getElementById("lostCategory").value
    );

    renderItems(
        "Found",
        "foundItems",
        document.getElementById("foundSearch").value,
        document.getElementById("foundCategory").value
    );

    renderClaims();
    renderAdmin();
}

// =====================================
// INITIALIZE APPLICATION
// =====================================

renderAll();
