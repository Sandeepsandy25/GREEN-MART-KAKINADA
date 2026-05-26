// script.js - GREEN MART KAKINADA

let vegetables = [];
let cart = [];
let activeTab = '';
let currentSearchQuery = '';
const WHATSAPP_NUMBER = '9000793333';

// Telugu translations for categories
const categoryTelugu = {
  'Leafy Vegetables': 'ఆకు కూరలు', 'Root Vegetables': 'మూల కూరలు',
  'Flower Vegetables': 'పుష్ప కూరలు', 'Fruit Vegetables': 'ఫల కూరలు',
  'Stem Vegetables': 'కాండ కూరలు', 'Bulb Vegetables': 'గడ్డ కూరలు',
  'Seed / Pod Vegetables': 'గింజల కూరలు', 'Exotic / International': 'అంతర్జాతీయ కూరలు'
};
const categoryEmoji = {
  'Leafy Vegetables': '🥬', 'Root Vegetables': '🥕', 'Flower Vegetables': '🥦',
  'Fruit Vegetables': '🍆', 'Stem Vegetables': '🌿', 'Bulb Vegetables': '🧅',
  'Seed / Pod Vegetables': '🌶️', 'Exotic / International': '🌍'
};

function getDeliveryCharge(subtotal) {
  return subtotal > 199 ? 0 : 30;
}

function updateCartUI() {
  const cartContainer = document.getElementById('cartItems');
  const cartCountSpan = document.getElementById('cartCount');
  const cartSubtotalSpan = document.getElementById('cartSubtotal');
  const deliveryRow = document.getElementById('deliveryChargeRow');
  const deliveryAmountSpan = document.getElementById('deliveryChargeAmount');
  const cartTotalSpan = document.getElementById('cartTotal');
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Cart is empty</div>';
    cartCountSpan.innerText = '0';
    cartSubtotalSpan.innerText = '₹0';
    deliveryRow.style.display = 'none';
    cartTotalSpan.innerText = '₹0';
    return;
  }

  let subtotal = 0;
  let html = '';
  cart.forEach((item, idx) => {
    subtotal += item.total;
    html += `
      <div class="cart-item" data-cart-idx="${idx}">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name} (${item.telugu})</div>
          <div class="cart-item-unit">${item.quantity} ${item.unit} @ ₹${item.price}/${item.unit}</div>
        </div>
        <div class="cart-item-price">₹${item.total.toFixed(2)}</div>
        <button class="cart-item-remove" data-id="${item.id}">🗑️</button>
      </div>
    `;
  });
  cartContainer.innerHTML = html;
  cartCountSpan.innerText = cart.length;
  cartSubtotalSpan.innerText = `₹${subtotal.toFixed(2)}`;

  const deliveryFee = getDeliveryCharge(subtotal);
  if (deliveryFee > 0) {
    deliveryRow.style.display = 'flex';
    deliveryAmountSpan.innerText = `₹${deliveryFee.toFixed(2)}`;
  } else {
    deliveryRow.style.display = 'flex';
    deliveryAmountSpan.innerText = 'Free 🎉';
  }
  const total = subtotal + deliveryFee;
  cartTotalSpan.innerText = `₹${total.toFixed(2)}`;

  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-id')));
  });
}

function addToCart(vegId, name, telugu, price, unit) {
  const veg = vegetables.find(v => v.id === vegId);
  if (!veg) { alert('Item not found.'); return; }
  if (veg.available === false) {
    alert(`❌ Sorry, ${name} is currently out of stock. Please choose another vegetable.`);
    return;
  }
  const qtyInput = document.getElementById(`qty-${vegId}`);
  let quantity = parseFloat(qtyInput.value);
  if (isNaN(quantity) || quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }
  quantity = Math.round(quantity * 10) / 10;
  const total = quantity * price;
  const existing = cart.find(item => item.id === vegId);
  if (existing) {
    existing.quantity += quantity;
    existing.total = existing.quantity * existing.price;
  } else {
    cart.push({ id: vegId, name, telugu, quantity, unit, price, total });
  }
  updateCartUI();
  qtyInput.value = '';
}

async function loadVegetables() {
  try {
    const response = await fetch('vegetables.json');
    if (!response.ok) throw new Error();
    const data = await response.json();
    vegetables = data.vegetables;
    vegetables.forEach(v => { if (v.available === undefined) v.available = true; });
  } catch (error) {
    console.warn('Using fallback data');
    vegetables = getFallbackVegetables();
  }
  buildTabsAndPanels();
  attachSearch();
  updateOrderTimingStatus();
  setInterval(updateOrderTimingStatus, 60000);
}

function getFallbackVegetables() {
  return [
    { id: 'tomato', name: 'Tomato', telugu: 'టమోటా', price: 40, emoji: '🍅', unit: 'kg', category: 'Fruit Vegetables', available: true },
    { id: 'potato', name: 'Potato', telugu: 'ఆలుగడ్డ', price: 30, emoji: '🥔', unit: 'kg', category: 'Root Vegetables', available: true }
  ];
}

function updateOrderTimingStatus() {
  const statusSpan = document.getElementById('orderStatusMessage');
  if (!statusSpan) return;
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours + minutes / 60;
  let isOpen = (currentTime >= 6 && currentTime <= 13) || (currentTime >= 16 && currentTime <= 21);
  statusSpan.innerHTML = isOpen ? '🟢 We are accepting orders now!' : '🔴 Orders closed. Please order between 6AM-1PM or 4PM-9PM.';
  statusSpan.style.color = isOpen ? '#0f5c2f' : '#c62828';
}

function buildTabsAndPanels() {
  const categories = getCategories();
  const tabNav = document.getElementById('tabsNav');
  const tabsContent = document.getElementById('tabsContent');
  if (!tabNav || !tabsContent) return;
  tabNav.innerHTML = '';
  tabsContent.innerHTML = '';
  const categoryNames = Object.keys(categories);
  if (categoryNames.length === 0) return;
  categoryNames.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    if (idx === 0) btn.classList.add('active');
    btn.setAttribute('data-category', cat);
    const tel = categoryTelugu[cat] || cat;
    const emoji = categoryEmoji[cat] || '🥗';
    btn.innerHTML = `${emoji} ${cat} (${tel})`;
    btn.onclick = () => switchTab(cat);
    tabNav.appendChild(btn);
  });
  categoryNames.forEach(cat => {
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.setAttribute('data-category', cat);
    panel.innerHTML = renderCategoryPanel(cat, categories[cat]);
    tabsContent.appendChild(panel);
  });
  if (categoryNames.length > 0) {
    activeTab = categoryNames[0];
    document.querySelector(`.tab-panel[data-category="${activeTab}"]`).classList.add('active-panel');
  }
}

function renderCategoryPanel(category, vegs) {
  const tel = categoryTelugu[category] || category;
  const emoji = categoryEmoji[category] || '🥗';
  return `
    <div class="category-header">
      <span class="category-emoji">${emoji}</span>
      <h3 class="category-title">${category} <span style="font-size:0.9rem; font-weight:normal;">(${tel})</span></h3>
      <span class="category-sub">${vegs.length} items</span>
    </div>
    <div class="product-grid">
      ${vegs.map(veg => `
        <div class="product-card" data-veg-id="${veg.id}" data-veg-name="${veg.name.toLowerCase()}" data-veg-telugu="${veg.telugu.toLowerCase()}">
          <div class="veg-emoji">${veg.emoji}</div>
          <div class="product-name">${veg.name}</div>
          <div class="product-name-telugu">${veg.telugu}</div>
          <div class="product-price">₹${veg.price} <span style="font-size:0.7rem;">/ ${veg.unit}</span></div>
          ${veg.available === false ? '<div style="color:#e53935; font-size:0.7rem; margin-bottom:8px;">❌ Out of stock</div>' : ''}
          <div class="quantity-control">
            <input type="number" class="quantity-input" id="qty-${veg.id}" min="0" step="0.5" placeholder="Qty" value="" ${veg.available === false ? 'disabled' : ''}>
            <button class="add-to-cart-btn" data-id="${veg.id}" data-name="${veg.name}" data-telugu="${veg.telugu}" data-price="${veg.price}" data-unit="${veg.unit}" ${veg.available === false ? 'disabled' : ''}>+ Add</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getCategories() {
  const cats = {};
  vegetables.forEach(veg => {
    if (!cats[veg.category]) cats[veg.category] = [];
    cats[veg.category].push(veg);
  });
  return cats;
}

function switchTab(category) {
  activeTab = category;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-category') === category) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    if (panel.getAttribute('data-category') === category) panel.classList.add('active-panel');
    else panel.classList.remove('active-panel');
  });
  if (currentSearchQuery) filterVegetables(currentSearchQuery);
}

function attachSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  if (!searchInput) return;
  const handleSearch = () => {
    currentSearchQuery = searchInput.value.trim().toLowerCase();
    filterVegetables(currentSearchQuery);
    clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
  };
  searchInput.addEventListener('input', handleSearch);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
    searchInput.focus();
  });
}

function filterVegetables(query) {
  const noResultsDiv = document.getElementById('noResultsMessage');
  let anyVisible = false;
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const cards = panel.querySelectorAll('.product-card');
    let panelHasVisible = false;
    cards.forEach(card => {
      const name = card.getAttribute('data-veg-name');
      const telugu = card.getAttribute('data-veg-telugu');
      const match = query === '' || name.includes(query) || telugu.includes(query);
      card.style.display = match ? '' : 'none';
      if (match) panelHasVisible = true;
    });
    panel.style.display = (query !== '' && !panelHasVisible) ? 'none' : '';
    if (panelHasVisible || query === '') anyVisible = true;
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const cat = btn.getAttribute('data-category');
    const panel = document.querySelector(`.tab-panel[data-category="${cat}"]`);
    if (panel && query !== '') {
      const hasVisible = panel.querySelector('.product-card[style=""]:not([style="display: none;"])');
      btn.style.display = hasVisible ? '' : 'none';
    } else {
      btn.style.display = '';
    }
  });
  noResultsDiv.style.display = (!anyVisible && query !== '') ? 'block' : 'none';
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
}

function attachAddToCartListeners() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn') && !e.target.disabled) {
      const btn = e.target;
      addToCart(btn.getAttribute('data-id'), btn.getAttribute('data-name'), btn.getAttribute('data-telugu'), parseFloat(btn.getAttribute('data-price')), btn.getAttribute('data-unit'));
    }
  });
}

function proceedToOrder() {
  if (cart.length === 0) { alert('Your cart is empty. Add some vegetables first.'); return; }
  const now = new Date();
  const hours = now.getHours();
  const currentTime = hours + now.getMinutes() / 60;
  if (!((currentTime >= 6 && currentTime <= 13) || (currentTime >= 16 && currentTime <= 21))) {
    alert('Orders are accepted only between 6:00 AM – 1:00 PM and 4:00 PM – 9:00 PM.');
    return;
  }
  document.getElementById('orderModal').style.display = 'flex';
}

function confirmOrder() {
  const name = document.getElementById('modalName').value.trim();
  const mobile = document.getElementById('modalMobile').value.trim();
  const address = document.getElementById('modalAddress').value.trim();
  if (!name) { alert('Please enter your name'); return; }
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) { alert('Valid 10-digit mobile required'); return; }
  if (!address) { alert('Please enter address'); return; }
  const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
  const deliveryFee = getDeliveryCharge(subtotal);
  const total = subtotal + deliveryFee;
  let orderLines = cart.map(item => `${item.name} (${item.telugu}): ${item.quantity} ${item.unit}  ₹${item.total.toFixed(2)}`).join('\n');
  const message = `🛒 *GREEN MART KAKINADA - New Order*\n\n${orderLines}\n\n💰 *Subtotal: ₹${subtotal.toFixed(2)}*\n🚚 *Delivery: ${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee.toFixed(2)}*\n💵 *Total Amount: ₹${total.toFixed(2)}* (Cash on Delivery)\n\n👤 Name: ${name}\n📱 Mobile: ${mobile}\n🏠 Address: ${address}\n\n✅ Only COD.`;
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  document.getElementById('orderModal').style.display = 'none';
  showSuccessPopup();
  cart = [];
  updateCartUI();
}

function showSuccessPopup() {
  const popup = document.getElementById('orderSuccessPopup');
  popup.style.display = 'flex';
  document.getElementById('closePopupBtn').onclick = () => popup.style.display = 'none';
  popup.onclick = (e) => { if (e.target === popup) popup.style.display = 'none'; };
}

function sendFeedback() {
  const message = `📝 *GREEN MART KAKINADA - Customer Feedback*\n\nHello! I recently placed an order. Here is my feedback:\n\n`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

async function init() {
  await loadVegetables();
  attachAddToCartListeners();
  updateCartUI();
  document.getElementById('proceedToOrderBtn').addEventListener('click', proceedToOrder);
  document.getElementById('confirmOrderBtn').addEventListener('click', confirmOrder);
  document.getElementById('feedbackBtn').addEventListener('click', sendFeedback);
  document.getElementById('feedbackFooterBtn').addEventListener('click', sendFeedback);
  const modal = document.getElementById('orderModal');
  const closeModal = document.querySelector('.close-modal');
  if (closeModal) closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

document.addEventListener('DOMContentLoaded', init);