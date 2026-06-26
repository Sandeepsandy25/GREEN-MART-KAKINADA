/**
 * GREEN MART KAKINADA – ENHANCED VERSION (Form-based Login)
 * Features: User Login/Register, Admin Login, Anonymous Guest,
 * cart, wishlist, order history, push notifications, checkout
 * Field names: userId, createdAt (exact match for Firestore index)
 */

let products = [];
let cart = [];
let wishlist = [];
let currentUser = null;
let userOrders = [];

// ========== FIREBASE AUTH ==========
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    console.log('✅ User UID:', user.uid, 'Anonymous:', user.isAnonymous);
    updateUserUI();
    updateAccountUI();
    registerForPushNotifications();
    await migrateLocalOrdersToFirestore();
    loadUserOrders();
  } else {
    try {
      const result = await auth.signInAnonymously();
      currentUser = result.user;
      console.log('✅ Anonymous user created:', currentUser.uid);
      updateUserUI();
      updateAccountUI();
      loadUserOrders();
    } catch (err) {
      console.error('Anonymous login error:', err);
    }
  }
});

// ========== CLOSE CART DRAWER ==========
function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ========== MIGRATE LOCAL ORDERS TO FIRESTORE ==========
async function migrateLocalOrdersToFirestore() {
  if (!currentUser || currentUser.isAnonymous) return;
  const localOrders = JSON.parse(localStorage.getItem('greenmart_orders') || '[]');
  if (localOrders.length === 0) return;
  console.log(`🔄 Migrating ${localOrders.length} local orders to Firestore...`);
  let migrated = 0;
  for (const order of localOrders) {
    try {
      await db.collection('orders').add({
        ...order,
        userId: currentUser.uid,
        migratedFromLocal: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      migrated++;
    } catch (err) {
      console.error('Migration error:', err);
    }
  }
  if (migrated > 0) {
    localStorage.removeItem('greenmart_orders');
    console.log(`✅ Migrated ${migrated} orders.`);
    showToast(`📦 ${migrated} previous orders saved.`);
  }
}

// ========== UI HELPERS ==========
function updateUserUI() {
  const userBtn = document.getElementById('userBtn');
  const btnSpan = userBtn?.querySelector('span');
  const btnIcon = userBtn?.querySelector('i');
  const mobileUserBtn = document.getElementById('mobileUserBtn');

  if (currentUser && !currentUser.isAnonymous) {
    const displayName = currentUser.displayName || currentUser.email || 'User';
    const shortName = displayName.length > 10 ? displayName.substring(0, 8) + '…' : displayName;
    if (btnSpan) { btnSpan.textContent = shortName; btnSpan.className = 'user-name-small'; }
    if (btnIcon) { btnIcon.className = 'fas fa-user-check'; btnIcon.style.color = 'var(--primary-green)'; }
    if (mobileUserBtn) { mobileUserBtn.innerHTML = `<i class="fas fa-user-check"></i> ${shortName}`; mobileUserBtn.style.color = 'var(--primary-green)'; }
  } else {
    if (btnSpan) { btnSpan.textContent = 'Account'; btnSpan.className = ''; }
    if (btnIcon) { btnIcon.className = 'far fa-user-circle'; btnIcon.style.color = ''; }
    if (mobileUserBtn) { mobileUserBtn.innerHTML = `<i class="far fa-user-circle"></i> Account`; mobileUserBtn.style.color = ''; }
  }
}

function updateAccountUI() {
  const guestView = document.getElementById('userGuestView');
  const signupView = document.getElementById('userSignupView');
  const loggedInView = document.getElementById('userLoggedInView');
  
  if (!currentUser) {
    if (guestView) guestView.style.display = 'block';
    if (signupView) signupView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'none';
    return;
  }
  if (currentUser.isAnonymous) {
    if (guestView) guestView.style.display = 'block';
    if (signupView) signupView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'none';
    const guestMsg = document.querySelector('#userGuestView p');
    if (guestMsg) guestMsg.textContent = 'You are browsing as a guest. Sign in to track orders.';
  } else {
    if (guestView) guestView.style.display = 'none';
    if (signupView) signupView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'block';
    document.getElementById('accountUserName').textContent = currentUser.displayName || currentUser.email || 'User';
    document.getElementById('accountUserEmail').textContent = currentUser.email || 'No email';
  }
}

// ========== ACCOUNT MODAL ==========
function openAccountModal() {
  document.getElementById('accountModal').style.display = 'flex';
  switchAccountTab('user-login');
  document.querySelectorAll('.auth-error').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
  updateAccountUI();
}

document.getElementById('userBtn').addEventListener('click', openAccountModal);
document.getElementById('mobileUserBtn').addEventListener('click', openAccountModal);
document.getElementById('closeAccountModal').addEventListener('click', () => {
  document.getElementById('accountModal').style.display = 'none';
});

function switchAccountTab(tabId) {
  document.querySelectorAll('.account-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.account-tab-panel').forEach(panel => panel.classList.remove('active-panel'));
  document.querySelector(`.account-tab[data-tab="${tabId}"]`)?.classList.add('active');
  document.querySelector(`#tab-${tabId}`)?.classList.add('active-panel');
}

document.querySelectorAll('.account-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.dataset.tab;
    switchAccountTab(tabId);
    document.querySelectorAll('.auth-error').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
  });
});

// ========== SHOW/HIDE SIGNUP ==========
document.getElementById('showSignupBtn')?.addEventListener('click', () => {
  document.getElementById('userGuestView').style.display = 'none';
  document.getElementById('userSignupView').style.display = 'block';
});
document.getElementById('showLoginBtn')?.addEventListener('click', () => {
  document.getElementById('userSignupView').style.display = 'none';
  document.getElementById('userGuestView').style.display = 'block';
});

// ========== USER LOGIN ==========
document.getElementById('userLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('userLoginEmail').value.trim();
  const password = document.getElementById('userLoginPassword').value;
  const errorEl = document.getElementById('userLoginError');
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  try {
    await auth.signInWithEmailAndPassword(email, password);
    showToast('✅ Welcome back!');
    document.getElementById('accountModal').style.display = 'none';
  } catch (err) {
    errorEl.style.display = 'block';
    errorEl.textContent = err.message === 'Firebase: Error (auth/user-not-found).' ? 'User not found. Please create an account.' : err.message;
  }
});

// ========== USER SIGNUP ==========
document.getElementById('userSignupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('userSignupName').value.trim();
  const email = document.getElementById('userSignupEmail').value.trim();
  const password = document.getElementById('userSignupPassword').value;
  const errorEl = document.getElementById('userSignupError');
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (name) await cred.user.updateProfile({ displayName: name });
    showToast('✅ Account created! Welcome!');
    document.getElementById('accountModal').style.display = 'none';
  } catch (err) {
    errorEl.style.display = 'block';
    errorEl.textContent = err.message;
  }
});

// ========== CONTINUE AS GUEST ==========
document.getElementById('continueAsGuestBtn')?.addEventListener('click', () => {
  document.getElementById('accountModal').style.display = 'none';
  if (!currentUser || !currentUser.isAnonymous) {
    auth.signInAnonymously().then(() => {
      showToast('✅ Browsing as guest');
    }).catch(err => console.error('Guest login error:', err));
  } else {
    showToast('You are already browsing as guest');
  }
});

// ========== LOGOUT ==========
document.getElementById('accountLogoutBtn')?.addEventListener('click', async () => {
  try {
    await auth.signOut();
    await auth.signInAnonymously();
    showToast('Logged out');
    document.getElementById('accountModal').style.display = 'none';
  } catch (err) {
    console.error('Logout error:', err);
  }
});

// ========== VIEW ORDERS ==========
document.getElementById('viewOrdersBtn')?.addEventListener('click', () => {
  document.getElementById('accountModal').style.display = 'none';
  document.getElementById('ordersModal').style.display = 'flex';
  renderOrders();
});

// ========== ADMIN LOGIN ==========
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminLoginEmail').value.trim();
  const password = document.getElementById('adminLoginPassword').value;
  const errorEl = document.getElementById('adminLoginError');
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const userDoc = await db.collection('users').doc(email).get();
    if (!userDoc.exists || !['super_admin', 'shop_admin'].includes(userDoc.data().role)) {
      await auth.signOut();
      errorEl.style.display = 'block';
      errorEl.textContent = 'Unauthorized: No admin role found.';
      return;
    }
    window.location.href = 'admin-login.html';
  } catch (err) {
    errorEl.style.display = 'block';
    errorEl.textContent = err.message;
  }
});

document.getElementById('adminLoginFooter')?.addEventListener('click', (e) => {
  e.preventDefault();
  openAccountModal();
  switchAccountTab('admin-login');
});

// ========== ORDERS ==========
async function loadUserOrders() {
  const localOrders = JSON.parse(localStorage.getItem('greenmart_orders') || '[]');
  if (currentUser && !currentUser.isAnonymous) {
    try {
      console.log('🔍 Fetching orders for user:', currentUser.uid);
      const snapshot = await db.collection('orders')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();
      const firestoreOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('📦 Firestore orders:', firestoreOrders.length);
      const existingIds = new Set(firestoreOrders.map(o => o.id));
      const extraLocal = localOrders.filter(o => !existingIds.has(o.id));
      userOrders = [...firestoreOrders, ...extraLocal];
      console.log('✅ Total orders after merge:', userOrders.length);
    } catch (err) {
      console.error('❌ Error loading Firestore orders:', err);
      if (err.message.includes('index')) {
        console.log('⚠️ Please create the index using the link above.');
        const container = document.getElementById('ordersList');
        if (container) {
          container.innerHTML = `<div class="order-empty"><div class="order-empty-icon">⚠️</div><p>Database index is being created. Please wait 2-3 minutes and refresh.</p></div>`;
        }
      }
      userOrders = localOrders;
    }
  } else {
    userOrders = localOrders;
  }
  renderOrders();
}

function renderOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;
  if (container.innerHTML.includes('Database index is being created')) return;
  if (!currentUser) {
    container.innerHTML = `<div class="order-empty"><div class="order-empty-icon">🔐</div><p>Please login to view your orders</p><button class="btn-primary" style="margin-top:12px;" onclick="openAccountModal()">Login Now</button></div>`;
    return;
  }
  if (userOrders.length === 0) {
    container.innerHTML = `<div class="order-empty"><div class="order-empty-icon">🛒</div><p>No orders yet. Start shopping!</p><button class="btn-primary" style="margin-top:12px;" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop Now</button></div>`;
    return;
  }
  container.innerHTML = userOrders.map(order => {
    const statusClass = order.status || 'pending';
    const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
    const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : (order.createdAt || 'N/A');
    const itemsHtml = order.items?.map(item => `<li>${item.name}: ${item.quantity} ${item.unit} × ₹${item.price}</li>`).join('') || '<li>No items</li>';
    return `<div class="order-card"><div class="order-card-header"><span class="order-id">Order #${order.id?.slice(0,8) || 'N/A'}</span><span class="order-status ${statusClass}">${statusLabel}</span><span class="order-date">${date}</span></div><ul class="order-items-list">${itemsHtml}</ul><div class="order-total">Total: ₹${order.total?.toFixed(2) || '0.00'}</div></div>`;
  }).join('');
}

document.getElementById('closeOrdersModal').addEventListener('click', () => {
  document.getElementById('ordersModal').style.display = 'none';
});

// ========== SAVE ORDER ==========
async function saveOrderToFirestore(orderData) {
  if (currentUser) {
    try {
      const docRef = await db.collection('orders').add({
        ...orderData,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      });
      console.log('✅ Order saved to Firestore with ID:', docRef.id);
      return;
    } catch (err) {
      console.error('❌ Error saving order to Firestore:', err);
    }
  }
  const localOrders = JSON.parse(localStorage.getItem('greenmart_orders') || '[]');
  const newOrder = {
    ...orderData,
    id: 'local_' + Date.now(),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  localOrders.push(newOrder);
  localStorage.setItem('greenmart_orders', JSON.stringify(localOrders));
  console.log('💾 Order saved locally (guest or fallback)');
}

// ========== CHECKOUT ==========
function initCheckout() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (!checkoutBtn) return;
  checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) { alert('Your cart is empty'); return; }
    const name = document.getElementById('checkoutName').value.trim();
    const mobile = document.getElementById('checkoutMobile').value.trim();
    let address = document.getElementById('checkoutAddress').value.trim();
    if (!name) { alert('Please enter your full name'); return; }
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) { alert('Please enter a valid 10-digit mobile number'); return; }
    if (!address) { alert('Please enter your delivery address'); return; }
    
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    const addressWithMap = `${address}\n🗺️ View on map: ${mapsLink}`;
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const delivery = getDeliveryFee(subtotal);
    const total = subtotal + delivery;
    const orderDetails = cart.map(i => {
      const unitDisplay = i.unit === 'kg' ? `${i.quantity} kg` : `${Math.round(i.quantity)} ${i.unit}`;
      return `${i.name}: ${unitDisplay} @ ₹${i.price}`;
    }).join('\n');
    const deliveryText = delivery === 0 ? 'FREE' : `₹${delivery}`;
    const message = `🛒 *GREEN MART KAKINADA - New Order*\n\n${orderDetails}\n\n💰 Subtotal: ₹${subtotal}\n🚚 Delivery: ${deliveryText}\n💵 Total: ₹${total}\n\n👤 Name: ${name}\n📱 Mobile: ${mobile}\n🏠 Address: ${addressWithMap}\n\n✅ Only COD.`;
    
    const orderData = {
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, unit: i.unit })),
      subtotal, delivery, total, customerName: name, customerPhone: mobile, address, status: 'pending'
    };
    
    await saveOrderToFirestore(orderData);
    
    window.open(`https://wa.me/919000793333?text=${encodeURIComponent(message)}`, '_blank');
    cart = []; saveCart(); updateCartUI(); closeCartDrawer();
    showToast('Order placed! Check your WhatsApp');
    document.getElementById('checkoutName').value = '';
    document.getElementById('checkoutMobile').value = '';
    document.getElementById('checkoutAddress').value = '';
    
    setTimeout(() => loadUserOrders(), 2000);
    
    if (currentUser && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Order Placed!', { body: `Your order of ₹${total} has been placed.`, icon: '🌿' });
    }
  });
}

// ========== PUSH NOTIFICATIONS ==========
function registerForPushNotifications() {
  if (!currentUser || !('Notification' in window)) return;
  if (localStorage.getItem('greenmart_notifications_subscribed') === 'true') return;
  setTimeout(() => {
    const prompt = document.getElementById('notificationPrompt');
    if (prompt) prompt.style.display = 'block';
  }, 5000);
}

document.getElementById('enableNotificationsBtn')?.addEventListener('click', async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('greenmart_notifications_subscribed', 'true');
      document.getElementById('notificationPrompt').style.display = 'none';
      showToast('✅ Notifications enabled!');
      try {
        const token = await messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY' });
        await db.collection('users').doc(currentUser.uid).set({ fcmToken: token, name: currentUser.displayName || '' }, { merge: true });
      } catch (e) { console.warn('FCM token error:', e); }
    } else {
      showToast('Notifications disabled.');
    }
  } catch (err) { console.error('Notification error:', err); }
});

document.getElementById('dismissNotificationsBtn')?.addEventListener('click', () => {
  document.getElementById('notificationPrompt').style.display = 'none';
  localStorage.setItem('greenmart_notifications_subscribed', 'dismissed');
});

// ========== ALL OTHER FUNCTIONS (unchanged) ==========

const features = [
  { icon: "🚜", title: "Fresh From Farms", desc: "Directly sourced from local farms" },
  { icon: "💰", title: "Affordable Pricing", desc: "Best prices in town" },
  { icon: "⚡", title: "Fast Delivery", desc: "60-90 mins delivery" },
  { icon: "🌿", title: "Organic Options", desc: "Certified organic produce" },
  { icon: "🧼", title: "Hygienic Packaging", desc: "Safe & clean packing" },
  { icon: "💬", title: "Customer Support", desc: "24/7 dedicated support" }
];

const testimonials = [
  { id: 1, name: "Rajesh Kumar", rating: 5, text: "Excellent quality vegetables! The delivery is always on time. Highly recommend!", avatar: "👨" },
  { id: 2, name: "Priya Sharma", rating: 5, text: "Love the fresh produce. Their organic section is amazing. Will order again!", avatar: "👩" },
  { id: 3, name: "Amit Verma", rating: 4, text: "Good prices and fast delivery. The app is very user-friendly.", avatar: "👨" },
  { id: 4, name: "Sneha Reddy", rating: 5, text: "The vegetables are farm fresh. Delivery boy was very polite.", avatar: "👩" }
];

const sampleProducts = [
  { id: "1", name: "Tomato", telugu: "టమాటో", category: "Fresh Vegetables", price: 40, unit: "kg", rating: 4.5, reviews: 120, emoji: "🍅", bestSeller: true, available: true },
  { id: "2", name: "Potato", telugu: "బంగాళదుంప", category: "Fresh Vegetables", price: 30, unit: "kg", rating: 4.3, reviews: 98, emoji: "🥔", bestSeller: false, available: true },
  { id: "3", name: "Onion", telugu: "ఉల్లిపాయ", category: "Fresh Vegetables", price: 35, unit: "kg", rating: 4.4, reviews: 85, emoji: "🧅", bestSeller: true, available: true },
  { id: "4", name: "Carrot", telugu: "క్యారెట్", category: "Fresh Vegetables", price: 45, unit: "kg", rating: 4.6, reviews: 67, emoji: "🥕", bestSeller: false, available: true },
  { id: "5", name: "Spinach", telugu: "పాలకూర", category: "Leafy Greens", price: 25, unit: "bunch", rating: 4.7, reviews: 52, emoji: "🥬", bestSeller: true, available: true },
  { id: "6", name: "Cucumber", telugu: "దోసకాయ", category: "Fresh Vegetables", price: 30, unit: "kg", rating: 4.2, reviews: 73, emoji: "🥒", bestSeller: false, available: true }
];

function getDeliveryFee(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal < 100) return 50;
  if (subtotal < 200) return 30;
  if (subtotal < 500) return 20;
  return 0;
}

async function loadProducts() {
  try {
    const querySnapshot = await db.collection('products').get();
    if (!querySnapshot.empty) {
      products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`✅ Loaded ${products.length} products from Firestore`);
    } else {
      console.log("No products in Firestore, using sample data");
      products = sampleProducts;
    }
  } catch (error) {
    console.error('Firestore error:', error);
    products = sampleProducts;
  }
  renderCategories();
  renderProducts(products);
  renderFeatures();
  renderTestimonials();
}

function getCategories() {
  const cats = {};
  products.forEach(p => { if (!cats[p.category]) cats[p.category] = 0; cats[p.category]++; });
  return Object.entries(cats).map(([name, count]) => ({ name, count, icon: getCategoryIcon(name) }));
}

function getCategoryIcon(cat) {
  const icons = {
    'Fresh Vegetables': '🥕', 'Fruits': '🍎', 'Leafy Greens': '🥬',
    'Dairy Products': '🥛', 'Special Items': '✨', 'Leafy Vegetables': '🥬',
    'Root Vegetables': '🥕', 'Flower Vegetables': '🥦', 'Fruit Vegetables': '🍆',
    'Stem Vegetables': '🌿', 'Bulb Vegetables': '🧅', 'Seed / Pod Vegetables': '🫘',
    'Exotic / International': '🌍'
  };
  return icons[cat] || '🥗';
}

function renderCategories() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;
  const cats = getCategories();
  if (cats.length === 0) { container.innerHTML = '<div>Loading categories...</div>'; return; }
  container.innerHTML = cats.map(cat => `<div class="category-card" data-category="${cat.name}"><div class="category-icon">${cat.icon}</div><h4>${cat.name}</h4><p>${cat.count} items</p></div>`).join('');
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const filtered = products.filter(p => p.category === card.dataset.category);
      renderProducts(filtered);
      document.getElementById('globalSearch').value = '';
      showToast(`Showing ${card.dataset.category}`);
    });
  });
}

function renderFeatures() {
  const container = document.getElementById('featuresGrid');
  if (container) container.innerHTML = features.map(f => `<div class="feature-card"><div class="feature-icon">${f.icon}</div><h4>${f.title}</h4><p>${f.desc}</p></div>`).join('');
}

function renderProducts(productArray) {
  const container = document.getElementById('productGrid');
  if (!container) return;
  if (!productArray.length) { container.innerHTML = '<div style="text-align:center; padding:40px;">No products found.</div>'; return; }
  container.innerHTML = productArray.map(product => {
    const isKg = product.unit === 'kg';
    const step = isKg ? '0.1' : '1';
    const min = isKg ? '0.1' : '1';
    const quickButtons = isKg ? `<div class="quick-qty-buttons"><button type="button" class="quick-qty" data-id="${product.id}" data-qty="0.25">250g</button><button type="button" class="quick-qty" data-id="${product.id}" data-qty="0.5">500g</button><button type="button" class="quick-qty" data-id="${product.id}" data-qty="1">1kg</button><button type="button" class="quick-qty" data-id="${product.id}" data-qty="2">2kg</button></div>` : '';
    const imageUrl = typeof getProductImage === 'function' ? getProductImage(product.id) : product.emoji;
    return `<div class="product-card" data-id="${product.id}">${product.bestSeller ? '<div class="product-badge">🔥 Best Seller</div>' : ''}<div class="product-image"><img src="${imageUrl}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover; display:block;">${!product.available ? '<div class="out-of-stock">Out of Stock</div>' : ''}<div class="wishlist-icon ${wishlist.includes(product.id) ? 'active' : ''}" data-id="${product.id}"><i class="far fa-heart"></i></div></div><div class="product-info"><div class="product-category">${product.category}</div><div class="product-name">${product.name}</div><div class="product-name-telugu">${product.telugu || ''}</div><div class="product-rating"><div class="stars">${'★'.repeat(Math.floor(product.rating || 4))}${'☆'.repeat(5-Math.floor(product.rating || 4))}</div><div class="review-count">(${product.reviews || 0})</div></div><div class="product-price-row"><span class="current-price">₹${product.price}</span></div><div class="product-unit">Per ${product.unit}</div><div class="quantity-add"><input type="number" id="qty-${product.id}" class="product-quantity" min="${min}" step="${step}" value="1"><button class="add-to-cart-btn" data-id="${product.id}" ${!product.available ? 'disabled' : ''}>${product.available ? 'Add to Cart' : 'Out of Stock'}</button></div>${quickButtons}<button class="quickview-btn" data-id="${product.id}">Quick View</button></div></div>`;
  }).join('');
  document.querySelectorAll('.quick-qty').forEach(btn => {
    btn.removeEventListener('click', handleQuickQty);
    btn.addEventListener('click', handleQuickQty);
  });
}

function handleQuickQty(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const qty = parseFloat(btn.dataset.qty);
  const qtyInput = document.getElementById(`qty-${id}`);
  if (qtyInput) qtyInput.value = qty;
  showToast(`Quantity set to ${qty} ${qty >= 1 ? 'kg' : 'g'}`);
}

function loadCart() {
  const saved = localStorage.getItem('greenmart_cart');
  if (saved) cart = JSON.parse(saved);
  updateCartUI();
}
function saveCart() { localStorage.setItem('greenmart_cart', JSON.stringify(cart)); }
function loadWishlist() {
  const saved = localStorage.getItem('greenmart_wishlist');
  if (saved) wishlist = JSON.parse(saved);
  updateWishlistUI();
}
function saveWishlist() { localStorage.setItem('greenmart_wishlist', JSON.stringify(wishlist)); updateWishlistUI(); }
function updateWishlistUI() {
  document.querySelectorAll('.wishlist-icon').forEach(icon => {
    const id = icon.dataset.id;
    if (wishlist.includes(id)) icon.classList.add('active');
    else icon.classList.remove('active');
  });
}
function updateCartUI() {
  updateCartDrawer();
  updateCartCount();
  const drawerCount = document.getElementById('cartDrawerCount');
  if (drawerCount) drawerCount.innerText = cart.reduce((sum, i) => sum + i.quantity, 0);
}
function updateCartCount() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => { if (el) el.innerText = totalItems; });
}
function updateCartDrawer() {
  const drawerItems = document.getElementById('cartDrawerItems');
  if (!drawerItems) return;
  if (cart.length === 0) { drawerItems.innerHTML = '<div style="text-align:center; padding:40px;">Your cart is empty</div>'; updateDrawerTotals(); return; }
  drawerItems.innerHTML = cart.map(item => {
    const product = products.find(p => p.id == item.id);
    const unitDisplay = item.unit === 'kg' ? `${item.quantity} kg` : `${Math.round(item.quantity)} ${item.unit}`;
    const imageUrl = typeof getProductImage === 'function' ? getProductImage(item.id) : (product?.emoji || '🥗');
    return `<div class="cart-item" data-id="${item.id}"><div class="cart-item-image"><img src="${imageUrl}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;"></div><div class="cart-item-details"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">₹${item.price} / ${item.unit}</div><div class="cart-item-quantity"><button class="quantity-btn dec-qty" data-id="${item.id}">-</button><span>${unitDisplay}</span><button class="quantity-btn inc-qty" data-id="${item.id}">+</button></div></div><div class="cart-item-total">₹${(item.price * item.quantity).toFixed(2)}</div><button class="remove-item" data-id="${item.id}">🗑️</button></div>`;
  }).join('');
  document.querySelectorAll('.dec-qty').forEach(btn => {
    btn.removeEventListener('click', handleQuantity);
    btn.addEventListener('click', handleQuantity);
  });
  document.querySelectorAll('.inc-qty').forEach(btn => {
    btn.removeEventListener('click', handleQuantity);
    btn.addEventListener('click', handleQuantity);
  });
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.removeEventListener('click', handleRemove);
    btn.addEventListener('click', handleRemove);
  });
  updateDrawerTotals();
}
function handleQuantity(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const action = btn.classList.contains('dec-qty') ? 'dec' : 'inc';
  updateQuantity(id, action);
}
function handleRemove(e) {
  const id = e.currentTarget.dataset.id;
  removeCartItem(id);
}
function updateQuantity(id, action) {
  const item = cart.find(i => i.id == id);
  if (!item) return;
  const product = products.find(p => p.id == id);
  const isKg = product?.unit === 'kg';
  const step = isKg ? 0.1 : 1;
  let newQty = item.quantity;
  if (action === 'inc') newQty += step;
  else if (action === 'dec') newQty -= step;
  if (newQty <= 0) {
    cart = cart.filter(i => i.id != id);
  } else {
    if (isKg) newQty = Math.round(newQty * 100) / 100;
    else newQty = Math.round(newQty);
    item.quantity = newQty;
  }
  saveCart();
  updateCartUI();
}
function removeCartItem(id) {
  cart = cart.filter(i => i.id != id);
  saveCart();
  updateCartUI();
}
function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  showToast('Cart cleared');
}
function updateDrawerTotals() {
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const deliveryCharge = getDeliveryFee(subtotal);
  const total = subtotal + deliveryCharge;
  document.getElementById('drawerSubtotal').innerText = `₹${subtotal.toFixed(2)}`;
  const deliverySpan = document.getElementById('drawerDelivery');
  if (deliverySpan) {
    if (subtotal === 0) deliverySpan.innerText = '₹0';
    else if (deliveryCharge === 0) deliverySpan.innerText = 'Free';
    else deliverySpan.innerText = `₹${deliveryCharge}`;
  }
  document.getElementById('drawerTotal').innerText = `₹${total.toFixed(2)}`;
}

function setupGlobalEventDelegation() {
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn && !addBtn.disabled) {
      e.preventDefault();
      const id = addBtn.dataset.id;
      const product = products.find(p => p.id == id);
      if (!product) return;
      const qtyInput = document.getElementById(`qty-${id}`);
      let quantity = parseFloat(qtyInput?.value || 1);
      if (isNaN(quantity) || quantity <= 0) quantity = 1;
      if (product.unit !== 'kg') {
        quantity = Math.round(quantity);
        if (quantity < 1) quantity = 1;
      } else {
        quantity = Math.round(quantity * 100) / 100;
      }
      const existing = cart.find(i => i.id == id);
      if (existing) existing.quantity += quantity;
      else cart.push({ id: product.id, name: product.name, price: product.price, quantity, unit: product.unit, emoji: product.emoji });
      saveCart();
      updateCartUI();
      const unitDisplay = product.unit === 'kg' ? `${quantity} kg` : `${quantity} ${product.unit}`;
      showToast(`${product.name} (${unitDisplay}) added to cart!`);
      if (qtyInput) qtyInput.value = 1;
    }
    const wishBtn = e.target.closest('.wishlist-icon');
    if (wishBtn) {
      e.preventDefault(); e.stopPropagation();
      const id = wishBtn.dataset.id;
      if (wishlist.includes(id)) {
        wishlist = wishlist.filter(i => i != id);
        showToast('Removed from wishlist');
      } else {
        wishlist.push(id);
        showToast('Added to wishlist!');
      }
      saveWishlist();
      wishBtn.classList.toggle('active', wishlist.includes(id));
    }
    const qvBtn = e.target.closest('.quickview-btn');
    if (qvBtn) {
      e.preventDefault();
      const id = qvBtn.dataset.id;
      const product = products.find(p => p.id == id);
      if (!product) return;
      showQuickViewModal(product);
    }
  });
  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) {
    clearBtn.removeEventListener('click', clearCart);
    clearBtn.addEventListener('click', clearCart);
  }
}

function showQuickViewModal(product) {
  const modal = document.getElementById('quickviewModal');
  const body = document.getElementById('quickviewBody');
  if (!modal || !body) return;
  const isKg = product.unit === 'kg';
  const step = isKg ? '0.1' : '1';
  const min = isKg ? '0.1' : '1';
  const imageUrl = typeof getProductImage === 'function' ? getProductImage(product.id) : product.emoji;
  body.innerHTML = `<div class="quickview-product"><div class="quickview-image"><img src="${imageUrl}" alt="${product.name}" style="width:100%; max-width:300px; height:auto; border-radius:16px; display:block; margin:0 auto;"></div><div class="quickview-details"><h2>${product.name}</h2><div style="font-size:0.9rem; color:#6B7280;">${product.telugu || ''}</div><div class="product-rating">${'★'.repeat(Math.floor(product.rating || 4))} (${product.reviews || 0} reviews)</div><p><strong>Price:</strong> ₹${product.price} per ${product.unit}</p><p><strong>Category:</strong> ${product.category}</p><p><strong>Stock:</strong> ${product.available ? '✅ In Stock' : '❌ Out of Stock'}</p><p><strong>Description:</strong> Fresh ${product.name} directly sourced from local farms. Premium quality guaranteed.</p><div style="margin-top:20px;"><input type="number" id="quick-qty" min="${min}" step="${step}" value="1" style="width:100px; padding:8px; border-radius:8px;"><button id="quick-add-cart" data-id="${product.id}" style="padding:8px 16px; background:#22C55E; color:white; border:none; border-radius:8px; margin-left:10px;">Add to Cart</button></div></div></div>`;
  modal.classList.add('active');
  const closeBtn = modal.querySelector('.close-quickview');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
  const addBtn = body.querySelector('#quick-add-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      let qty = parseFloat(document.getElementById('quick-qty').value);
      if (isNaN(qty) || qty <= 0) qty = 1;
      if (product.unit !== 'kg') qty = Math.round(qty);
      if (product && qty > 0) {
        const existing = cart.find(i => i.id == product.id);
        if (existing) existing.quantity += qty;
        else cart.push({ id: product.id, name: product.name, price: product.price, quantity: qty, unit: product.unit, emoji: product.emoji });
        saveCart();
        updateCartUI();
        showToast(`${product.name} added to cart!`);
        modal.classList.remove('active');
      }
    });
  }
}

function initLocationButton() {
  const locBtn = document.getElementById('getLocationBtn');
  if (!locBtn) return;
  locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    locBtn.disabled = true;
    locBtn.textContent = '⏳ Fetching location...';
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          let address = data.display_name || 'Address not found';
          if (address.includes(',')) address = address.split(',').slice(0, 3).join(',');
          document.getElementById('checkoutAddress').value = address;
          showToast('📍 Location added!');
        } catch (error) {
          document.getElementById('checkoutAddress').value = `Lat: ${latitude}, Lng: ${longitude}`;
          showToast('Coordinates added.');
        }
        locBtn.disabled = false;
        locBtn.textContent = '📍 Get Current Location';
      },
      (error) => {
        alert('Unable to get location. Please enter address manually.');
        locBtn.disabled = false;
        locBtn.textContent = '📍 Get Current Location';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function initSearch() {
  const searchInput = document.getElementById('globalSearch');
  if (searchInput) searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || (p.telugu && p.telugu.toLowerCase().includes(query)));
    renderProducts(filtered);
  });
}

function initNewsletter() {
  const subscribeBtn = document.getElementById('newsletterSubscribe');
  if (subscribeBtn) subscribeBtn.addEventListener('click', () => {
    const email = document.getElementById('newsletterEmail').value.trim();
    if (email && email.includes('@')) {
      let subs = JSON.parse(localStorage.getItem('greenmart_newsletter') || '[]');
      if (!subs.includes(email)) { subs.push(email); localStorage.setItem('greenmart_newsletter', JSON.stringify(subs)); showToast('✅ Subscribed!'); }
      else showToast('Already subscribed!');
      document.getElementById('newsletterEmail').value = '';
    } else alert('Enter a valid email');
  });
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cartBtn');
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const closeDrawerBtn = document.getElementById('closeDrawer');
  const continueShopping = document.getElementById('continueShopping');
  const mobileCartBtn = document.querySelector('.mobile-cart');
  const openDrawer = (e) => {
    if (e) e.preventDefault();
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };
  if (cartBtn) cartBtn.addEventListener('click', openDrawer);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (continueShopping) continueShopping.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('active'));
    const links = mobileMenu.querySelectorAll('a, button');
    links.forEach(link => link.addEventListener('click', () => mobileMenu.classList.remove('active')));
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target) && mobileMenu.classList.contains('active'))
        mobileMenu.classList.remove('active');
    });
  }
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }));
}

function initCTAScroll() {
  const shopNow = document.getElementById('shopNowBtn');
  const explore = document.getElementById('exploreCategoriesBtn');
  if (shopNow) shopNow.addEventListener('click', () => document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' }));
  if (explore) explore.addEventListener('click', () => document.querySelector('#categories')?.scrollIntoView({ behavior: 'smooth' }));
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.innerText = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function renderTestimonials() {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  track.innerHTML = testimonials.map(t => `<div class="testimonial-card"><div class="testimonial-avatar">${t.avatar}</div><h4 class="testimonial-name">${t.name}</h4><div class="testimonial-rating">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div><p class="testimonial-text">"${t.text}"</p></div>`).join('');
  initTestimonialSlider();
}
let currentSlide = 0;
function initTestimonialSlider() {
  const track = document.querySelector('.testimonial-track');
  const slides = document.querySelectorAll('.testimonial-card');
  if (!track || slides.length === 0) return;
  track.style.display = 'flex'; track.style.transition = 'transform 0.5s ease';
  const update = () => track.style.transform = `translateX(-${currentSlide * 100}%)`;
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { currentSlide = (currentSlide - 1 + slides.length) % slides.length; update(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { currentSlide = (currentSlide + 1) % slides.length; update(); });
  update();
  setInterval(() => { currentSlide = (currentSlide + 1) % slides.length; update(); }, 5000);
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  loadCart();
  loadWishlist();
  setupGlobalEventDelegation();
  initSearch();
  initNewsletter();
  initCheckout();
  initCartDrawer();
  initMobileMenu();
  initSmoothScroll();
  initCTAScroll();
  initLocationButton();
  renderTestimonials();
  if (currentUser) loadUserOrders();
});
