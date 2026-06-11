/**
 * GREEN MART ADMIN PANEL – FULLY FUNCTIONAL
 * Features: product management, price updates, banners, offers, statistics, activity log
 * Roles: super_admin (full access), shop_admin (can only edit price & availability)
 */

let currentUser = null;
let currentUserRole = null;

// Firebase services (already initialised in HTML)
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const sections = {
  products: document.getElementById('productsSection'),
  banners: document.getElementById('bannersSection'),
  offers: document.getElementById('offersSection'),
  stats: document.getElementById('statsSection'),
  logs: document.getElementById('logsSection')
};
const navBtns = document.querySelectorAll('.nav-btn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailSpan = document.getElementById('userEmail');

// Modals
const productModal = document.getElementById('productModal');
const bannerModal = document.getElementById('bannerModal');
const offerModal = document.getElementById('offerModal');

// Global products array (for filtering)
let allProducts = [];

// ========== AUTH STATE ==========
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'admin-login.html';
    return;
  }
  currentUser = user;
  userEmailSpan.textContent = user.email;
  const userDoc = await db.collection('users').doc(user.email).get();
  if (!userDoc.exists) {
    await auth.signOut();
    window.location.href = 'admin-login.html';
    return;
  }
  currentUserRole = userDoc.data().role;
  if (currentUserRole === 'shop_admin') {
    // Hide banner & offer management for shop admin
    document.querySelectorAll('[data-section="banners"], [data-section="offers"]').forEach(btn => btn.style.display = 'none');
    document.getElementById('addProductBtn').style.display = 'none';
  }
  loadProducts();
  if (currentUserRole === 'super_admin') {
    loadBanners();
    loadOffers();
  }
  loadStatistics();
  loadActivityLog();
});

// ========== NAVIGATION ==========
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    Object.values(sections).forEach(sec => sec.classList.remove('active'));
    sections[section].classList.add('active');
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (section === 'logs') loadActivityLog();
    if (section === 'stats') loadStatistics();
  });
});

logoutBtn.addEventListener('click', () => auth.signOut());

// ========== PRODUCT MANAGEMENT ==========
async function loadProducts() {
  const tbody = document.querySelector('#productsTable tbody');
  const searchInput = document.getElementById('searchProducts');
  const categoryFilter = document.getElementById('categoryFilter');

  const snapshot = await db.collection('products').get();
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Populate category filter dynamically
  const categories = [...new Set(allProducts.map(p => p.category))];
  categoryFilter.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');

  const render = (productsArray) => {
    tbody.innerHTML = '';
    productsArray.forEach(prod => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = prod.name;
      row.insertCell(1).textContent = prod.telugu || '-';
      row.insertCell(2).innerHTML = `<input type="number" id="price-${prod.id}" value="${prod.price}" step="1" style="width:80px" class="price-input">`;
      row.insertCell(3).textContent = prod.unit;
      row.insertCell(4).textContent = prod.category;
      row.insertCell(5).innerHTML = `<span class="status-badge ${prod.available ? 'status-available' : 'status-unavailable'}">${prod.available ? 'Available' : 'Out of Stock'}</span>`;
      const actionsCell = row.insertCell(6);
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'edit-btn';
      saveBtn.onclick = () => updateProductPrice(prod.id, prod.name, parseInt(document.getElementById(`price-${prod.id}`).value));
      actionsCell.appendChild(saveBtn);
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = 'Toggle Stock';
      toggleBtn.className = 'toggle-stock';
      toggleBtn.onclick = () => toggleProductAvailability(prod.id, prod.name, !prod.available);
      actionsCell.appendChild(toggleBtn);
      if (currentUserRole === 'super_admin') {
        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.className = 'edit-btn';
        editBtn.onclick = () => openProductModal(prod);
        actionsCell.appendChild(editBtn);
      }
    });
    attachPriceInputListeners();
  };

  const attachPriceInputListeners = () => {
    document.querySelectorAll('.price-input').forEach(input => {
      input.removeEventListener('change', handlePriceChange);
      input.addEventListener('change', handlePriceChange);
    });
  };

  const handlePriceChange = async (e) => {
    const id = e.target.id.replace('price-', '');
    const newPrice = parseInt(e.target.value);
    const product = allProducts.find(p => p.id === id);
    if (product && newPrice !== product.price) {
      await updateProductPrice(id, product.name, newPrice);
    }
  };

  const filter = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    let filtered = allProducts;
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    if (category) filtered = filtered.filter(p => p.category === category);
    render(filtered);
  };
  searchInput.addEventListener('input', filter);
  categoryFilter.addEventListener('change', filter);
  render(allProducts);
}

async function updateProductPrice(id, name, newPrice) {
  const oldPrice = (await db.collection('products').doc(id).get()).data().price;
  if (oldPrice === newPrice) return;
  await db.collection('products').doc(id).update({ price: newPrice });
  await db.collection('activityLog').add({
    adminEmail: currentUser.email,
    action: 'price_update',
    productId: id,
    productName: name,
    oldPrice: oldPrice,
    newPrice: newPrice,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast(`Price of ${name} updated to ₹${newPrice}`);
  loadStatistics();
}

async function toggleProductAvailability(id, name, newStatus) {
  await db.collection('products').doc(id).update({ available: newStatus });
  await db.collection('activityLog').add({
    adminEmail: currentUser.email,
    action: newStatus ? 'made_available' : 'made_unavailable',
    productId: id,
    productName: name,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  loadProducts();
  loadStatistics();
}

// Super admin only – add/edit product
function openProductModal(product = null) {
  if (currentUserRole !== 'super_admin') return;
  document.getElementById('modalTitle').innerText = product ? 'Edit Product' : 'Add Product';
  document.getElementById('productId').value = product ? product.id : '';
  document.getElementById('prodName').value = product ? product.name : '';
  document.getElementById('prodTelugu').value = product ? product.telugu : '';
  document.getElementById('prodPrice').value = product ? product.price : '';
  document.getElementById('prodUnit').value = product ? product.unit : '';
  document.getElementById('prodCategory').value = product ? product.category : 'Fresh Vegetables';
  document.getElementById('prodEmoji').value = product ? product.emoji : '';
  document.getElementById('prodAvailable').checked = product ? product.available : true;
  productModal.style.display = 'flex';
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('prodName').value,
    telugu: document.getElementById('prodTelugu').value,
    price: parseInt(document.getElementById('prodPrice').value),
    unit: document.getElementById('prodUnit').value,
    category: document.getElementById('prodCategory').value,
    emoji: document.getElementById('prodEmoji').value || '🥗',
    available: document.getElementById('prodAvailable').checked
  };
  if (id) {
    await db.collection('products').doc(id).update(data);
  } else {
    const newId = data.name.toLowerCase().replace(/ /g, '_');
    await db.collection('products').doc(newId).set({ id: newId, ...data });
  }
  productModal.style.display = 'none';
  loadProducts();
  loadStatistics();
});

// ========== BANNER MANAGEMENT (Super Admin only) ==========
async function loadBanners() {
  if (currentUserRole !== 'super_admin') return;
  const container = document.getElementById('bannersList');
  const snapshot = await db.collection('banners').get();
  container.innerHTML = '';
  snapshot.forEach(doc => {
    const banner = doc.data();
    const card = document.createElement('div');
    card.className = 'banner-card';
    card.innerHTML = `
      <img src="${banner.imageUrl}" alt="${banner.title}">
      <div class="banner-info">
        <h4>${banner.title || 'Untitled'}</h4>
        <p>${banner.active ? '✅ Active' : '❌ Inactive'}</p>
        <div class="banner-actions">
          <button class="edit-btn" data-id="${doc.id}">Edit</button>
          <button class="delete-btn" data-id="${doc.id}">Delete</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  document.querySelectorAll('.banner-actions .edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openBannerModal(btn.dataset.id));
  });
  document.querySelectorAll('.banner-actions .delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await db.collection('banners').doc(btn.dataset.id).delete();
      loadBanners();
    });
  });
}

function openBannerModal(id = null) {
  if (currentUserRole !== 'super_admin') return;
  if (id) {
    db.collection('banners').doc(id).get().then(doc => {
      const banner = doc.data();
      document.getElementById('bannerId').value = doc.id;
      document.getElementById('bannerImage').value = banner.imageUrl;
      document.getElementById('bannerTitle').value = banner.title || '';
      document.getElementById('bannerLink').value = banner.link || '';
      document.getElementById('bannerActive').checked = banner.active;
      bannerModal.style.display = 'flex';
    });
  } else {
    document.getElementById('bannerId').value = '';
    document.getElementById('bannerImage').value = '';
    document.getElementById('bannerTitle').value = '';
    document.getElementById('bannerLink').value = '';
    document.getElementById('bannerActive').checked = true;
    bannerModal.style.display = 'flex';
  }
}

document.getElementById('bannerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('bannerId').value;
  const data = {
    imageUrl: document.getElementById('bannerImage').value,
    title: document.getElementById('bannerTitle').value,
    link: document.getElementById('bannerLink').value,
    active: document.getElementById('bannerActive').checked
  };
  if (id) {
    await db.collection('banners').doc(id).update(data);
  } else {
    await db.collection('banners').add(data);
  }
  bannerModal.style.display = 'none';
  loadBanners();
});

// ========== OFFER MANAGEMENT (Super Admin only) ==========
async function loadOffers() {
  if (currentUserRole !== 'super_admin') return;
  const container = document.getElementById('offersList');
  const snapshot = await db.collection('offers').get();
  container.innerHTML = '';
  snapshot.forEach(doc => {
    const offer = doc.data();
    const card = document.createElement('div');
    card.className = 'offer-card';
    card.innerHTML = `
      <div class="offer-info">
        <h4>${offer.title}</h4>
        <p>${offer.description || ''}</p>
        <p><strong>Code:</strong> ${offer.couponCode}</p>
        <p><strong>Discount:</strong> ${offer.discountPercent}%</p>
        <p><strong>Valid till:</strong> ${offer.validUntil || 'N/A'}</p>
        <p>${offer.active ? '✅ Active' : '❌ Inactive'}</p>
        <div class="offer-actions">
          <button class="edit-btn" data-id="${doc.id}">Edit</button>
          <button class="delete-btn" data-id="${doc.id}">Delete</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  document.querySelectorAll('.offer-actions .edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openOfferModal(btn.dataset.id));
  });
  document.querySelectorAll('.offer-actions .delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await db.collection('offers').doc(btn.dataset.id).delete();
      loadOffers();
    });
  });
}

function openOfferModal(id = null) {
  if (currentUserRole !== 'super_admin') return;
  if (id) {
    db.collection('offers').doc(id).get().then(doc => {
      const offer = doc.data();
      document.getElementById('offerId').value = doc.id;
      document.getElementById('offerTitle').value = offer.title;
      document.getElementById('offerDesc').value = offer.description || '';
      document.getElementById('offerCode').value = offer.couponCode;
      document.getElementById('offerDiscount').value = offer.discountPercent;
      document.getElementById('offerValidUntil').value = offer.validUntil || '';
      document.getElementById('offerActive').checked = offer.active;
      offerModal.style.display = 'flex';
    });
  } else {
    document.getElementById('offerId').value = '';
    document.getElementById('offerTitle').value = '';
    document.getElementById('offerDesc').value = '';
    document.getElementById('offerCode').value = '';
    document.getElementById('offerDiscount').value = '';
    document.getElementById('offerValidUntil').value = '';
    document.getElementById('offerActive').checked = true;
    offerModal.style.display = 'flex';
  }
}

document.getElementById('offerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('offerId').value;
  const data = {
    title: document.getElementById('offerTitle').value,
    description: document.getElementById('offerDesc').value,
    couponCode: document.getElementById('offerCode').value,
    discountPercent: parseInt(document.getElementById('offerDiscount').value),
    validUntil: document.getElementById('offerValidUntil').value,
    active: document.getElementById('offerActive').checked
  };
  if (id) {
    await db.collection('offers').doc(id).update(data);
  } else {
    await db.collection('offers').add(data);
  }
  offerModal.style.display = 'none';
  loadOffers();
});

// ========== STATISTICS ==========
async function loadStatistics() {
  const productsSnap = await db.collection('products').get();
  const total = productsSnap.size;
  let available = 0, outOfStock = 0;
  productsSnap.forEach(doc => {
    if (doc.data().available) available++;
    else outOfStock++;
  });
  const lastUpdated = await db.collection('activityLog').orderBy('timestamp', 'desc').limit(1).get();
  let lastUpdatedDate = 'Never';
  if (!lastUpdated.empty) {
    const ts = lastUpdated.docs[0].data().timestamp;
    if (ts) lastUpdatedDate = ts.toDate().toLocaleString();
  }
  document.getElementById('statsCards').innerHTML = `
    <div class="stat-card"><div class="stat-number">${total}</div><div>Total Products</div></div>
    <div class="stat-card"><div class="stat-number">${available}</div><div>Available</div></div>
    <div class="stat-card"><div class="stat-number">${outOfStock}</div><div>Out of Stock</div></div>
    <div class="stat-card"><div class="stat-number">${lastUpdatedDate}</div><div>Last Updated</div></div>
  `;
  const logsSnap = await db.collection('activityLog').where('action', '==', 'price_update').orderBy('timestamp', 'desc').limit(5).get();
  let listHtml = '<ul>';
  logsSnap.forEach(log => {
    const data = log.data();
    listHtml += `<li>${data.productName} – ₹${data.newPrice} (updated by ${data.adminEmail} on ${data.timestamp?.toDate().toLocaleString() || 'unknown'})</li>`;
  });
  listHtml += '</ul>';
  document.getElementById('lastUpdatedList').innerHTML = listHtml;
}

// ========== ACTIVITY LOG ==========
async function loadActivityLog() {
  const tbody = document.querySelector('#logsTable tbody');
  const snapshot = await db.collection('activityLog').orderBy('timestamp', 'desc').limit(50).get();
  tbody.innerHTML = '';
  snapshot.forEach(doc => {
    const log = doc.data();
    const row = tbody.insertRow();
    row.insertCell(0).textContent = log.adminEmail;
    row.insertCell(1).textContent = log.action;
    row.insertCell(2).textContent = log.productName || '-';
    row.insertCell(3).textContent = log.oldPrice !== undefined ? `₹${log.oldPrice}` : '-';
    row.insertCell(4).textContent = log.newPrice !== undefined ? `₹${log.newPrice}` : '-';
    row.insertCell(5).textContent = log.timestamp ? log.timestamp.toDate().toLocaleString() : '';
  });
}

// ========== MODAL CLOSE & UTILITIES ==========
document.querySelectorAll('.close, .modal').forEach(el => {
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
      productModal.style.display = 'none';
      bannerModal.style.display = 'none';
      offerModal.style.display = 'none';
    }
  });
});

document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
document.getElementById('addBannerBtn').addEventListener('click', () => openBannerModal());
document.getElementById('addOfferBtn').addEventListener('click', () => openOfferModal());

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = '#1F2937';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '40px';
  toast.style.zIndex = '9999';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
