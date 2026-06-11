/**
 * GREEN MART KAKINADA – MAIN WEBSITE (Firestore version)
 * Features: product loading from Firestore, cart (localStorage), wishlist, checkout, location, search, coupons, newsletter, account modal.
 * Fully responsive, works on desktop and mobile.
 */

let products = [];
let cart = [];
let wishlist = [];
let couponApplied = false;
let couponDiscount = 0;
const DELIVERY_FEE_THRESHOLD = 499;
const DELIVERY_FEE = 40;

// Features Data (static)
const features = [
  { icon: "🚜", title: "Fresh From Farms", desc: "Directly sourced from local farms" },
  { icon: "💰", title: "Affordable Pricing", desc: "Best prices in town" },
  { icon: "⚡", title: "Fast Delivery", desc: "60-90 mins delivery" },
  { icon: "🌿", title: "Organic Options", desc: "Certified organic produce" },
  { icon: "🧼", title: "Hygienic Packaging", desc: "Safe & clean packing" },
  { icon: "💬", title: "Customer Support", desc: "24/7 dedicated support" }
];

// Testimonials (static)
const testimonials = [
  { id: 1, name: "Rajesh Kumar", rating: 5, text: "Excellent quality vegetables! The delivery is always on time. Highly recommend!", avatar: "👨" },
  { id: 2, name: "Priya Sharma", rating: 5, text: "Love the fresh produce. Their organic section is amazing. Will order again!", avatar: "👩" },
  { id: 3, name: "Amit Verma", rating: 4, text: "Good prices and fast delivery. The app is very user-friendly.", avatar: "👨" },
  { id: 4, name: "Sneha Reddy", rating: 5, text: "The vegetables are farm fresh. Delivery boy was very polite.", avatar: "👩" }
];

// ========== LOAD PRODUCTS FROM FIRESTORE ==========
async function loadProducts() {
  try {
    const querySnapshot = await db.collection('products').get();
    products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Loaded ${products.length} products from Firestore`);
  } catch (error) {
    console.error('Firestore error:', error);
    products = [];
  }
  renderCategories();
  renderProducts(products);
  renderFeatures();
  renderTestimonials();
}

// ========== CATEGORY & RENDER FUNCTIONS ==========
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
  container.innerHTML = productArray.map(product => `
    <div class="product-card" data-id="${product.id}">
      ${product.bestSeller ? '<div class="product-badge">🔥 Best Seller</div>' : ''}
      <div class="product-image">
        <div style="font-size:80px; display:flex; align-items:center; justify-content:center; height:220px; background:#f3f4f6;">${product.emoji}</div>
        ${!product.available ? '<div class="out-of-stock">Out of Stock</div>' : ''}
        <div class="wishlist-icon ${wishlist.includes(product.id) ? 'active' : ''}" data-id="${product.id}"><i class="far fa-heart"></i></div>
      </div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-name-telugu">${product.telugu}</div>
        <div class="product-rating"><div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</div><div class="review-count">(${product.reviews})</div></div>
        <div class="product-price-row"><span class="current-price">₹${product.price}</span><span class="original-price">₹${product.originalPrice}</span><span class="discount-badge">${product.discount}% OFF</span></div>
        <div class="product-unit">Per ${product.unit}</div>
        <div class="quantity-add"><input type="number" id="qty-${product.id}" class="product-quantity" min="0.5" step="0.5" value="1"><button class="add-to-cart-btn" data-id="${product.id}" ${!product.available ? 'disabled' : ''}>${product.available ? 'Add to Cart' : 'Out of Stock'}</button></div>
        <button class="quickview-btn" data-id="${product.id}">Quick View</button>
      </div>
    </div>`).join('');
}
function attachProductEventListeners() { /* event delegation handles everything */ }

// ========== CART & WISHLIST (localStorage) ==========
function loadCart() {
  const saved = localStorage.getItem('greenmart_cart');
  if (saved) cart = JSON.parse(saved);
  updateCartUI();
}
function saveCart() {
  localStorage.setItem('greenmart_cart', JSON.stringify(cart));
}
function loadWishlist() {
  const saved = localStorage.getItem('greenmart_wishlist');
  if (saved) wishlist = JSON.parse(saved);
  updateWishlistUI();
}
function saveWishlist() {
  localStorage.setItem('greenmart_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
}
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
  if (cart.length === 0) {
    drawerItems.innerHTML = '<div style="text-align:center; padding:40px;">Your cart is empty</div>';
    updateDrawerTotals();
    return;
  }
  drawerItems.innerHTML = cart.map(item => {
    const product = products.find(p => p.id == item.id);
    return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">${product?.emoji || '🥗'}</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price}</div>
          <div class="cart-item-quantity">
            <button class="quantity-btn dec-qty" data-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn inc-qty" data-id="${item.id}">+</button>
          </div>
        </div>
        <div class="cart-item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
        <button class="remove-item" data-id="${item.id}">🗑️</button>
      </div>
    `;
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
  if (action === 'inc') item.quantity++;
  else if (action === 'dec') {
    if (item.quantity <= 0.5) {
      cart = cart.filter(i => i.id != id);
    } else {
      item.quantity -= 0.5;
      item.quantity = Math.round(item.quantity * 10) / 10;
    }
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
  couponApplied = false;
  couponDiscount = 0;
  saveCart();
  updateCartUI();
  showToast('Cart cleared');
}
function updateDrawerTotals() {
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const deliveryCharge = subtotal >= DELIVERY_FEE_THRESHOLD ? 0 : (subtotal > 0 ? DELIVERY_FEE : 0);
  const discountAmount = couponApplied ? subtotal * (couponDiscount / 100) : 0;
  const total = subtotal + deliveryCharge - discountAmount;
  const subtotalSpan = document.getElementById('drawerSubtotal');
  const deliverySpan = document.getElementById('drawerDelivery');
  const discountSpan = document.getElementById('drawerDiscount');
  const totalSpan = document.getElementById('drawerTotal');
  const discountRow = document.getElementById('discountRow');
  if (subtotalSpan) subtotalSpan.innerText = `₹${subtotal.toFixed(2)}`;
  if (deliverySpan) deliverySpan.innerText = deliveryCharge === 0 ? (subtotal > 0 ? 'Free' : '₹0') : `₹${deliveryCharge}`;
  if (discountSpan && discountRow) {
    discountSpan.innerText = `-₹${discountAmount.toFixed(2)}`;
    discountRow.style.display = couponApplied ? 'flex' : 'none';
  }
  if (totalSpan) totalSpan.innerText = `₹${total.toFixed(2)}`;
}

// ========== EVENT HANDLERS (delegation) ==========
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
      quantity = Math.round(quantity * 10) / 10;
      const existing = cart.find(i => i.id == id);
      if (existing) existing.quantity += quantity;
      else cart.push({ id: product.id, name: product.name, price: product.price, quantity, unit: product.unit, emoji: product.emoji });
      saveCart();
      updateCartUI();
      showToast(`${product.name} (${quantity} ${product.unit}) added to cart!`);
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
  body.innerHTML = `
    <div class="quickview-product">
      <div class="quickview-image"><div style="font-size:100px;">${product.emoji}</div></div>
      <div class="quickview-details">
        <h2>${product.name}</h2>
        <div style="font-size:0.9rem; color:#6B7280;">${product.telugu}</div>
        <div class="product-rating">${'★'.repeat(Math.floor(product.rating))} (${product.reviews} reviews)</div>
        <p><strong>Price:</strong> ₹${product.price} <del>₹${product.originalPrice}</del> <span style="color:#22C55E;">${product.discount}% OFF</span></p>
        <p><strong>Unit:</strong> ${product.unit}</p>
        <p><strong>Category:</strong> ${product.category}</p>
        <p><strong>Stock:</strong> ${product.available ? '✅ In Stock' : '❌ Out of Stock'}</p>
        <p><strong>Description:</strong> Fresh ${product.name} directly sourced from local farms. Premium quality guaranteed.</p>
        <div style="margin-top:20px;">
          <input type="number" id="quick-qty" min="0.5" step="0.5" value="1" style="width:80px; padding:8px; border-radius:8px;">
          <button id="quick-add-cart" data-id="${product.id}" style="padding:8px 16px; background:#22C55E; color:white; border:none; border-radius:8px;">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('active');
  const closeBtn = modal.querySelector('.close-quickview');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
  const addBtn = body.querySelector('#quick-add-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const qty = parseFloat(document.getElementById('quick-qty').value);
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

// ========== CHECKOUT (with Google Maps link) ==========
function initCheckout() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
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
      const delivery = subtotal >= DELIVERY_FEE_THRESHOLD ? 0 : DELIVERY_FEE;
      const discountAmt = couponApplied ? subtotal * (couponDiscount / 100) : 0;
      const total = subtotal + delivery - discountAmt;
      const orderDetails = cart.map(i => `${i.name}: ${i.quantity} ${i.unit} @ ₹${i.price}`).join('\n');
      const message = `🛒 *GREEN MART KAKINADA - New Order*\n\n${orderDetails}\n\n💰 Subtotal: ₹${subtotal}\n🚚 Delivery: ${delivery === 0 ? 'FREE' : '₹' + delivery}\n🎟️ Discount: -₹${discountAmt}\n💵 Total: ₹${total}\n\n👤 Name: ${name}\n📱 Mobile: ${mobile}\n🏠 Address: ${addressWithMap}\n\n✅ Only COD.`;
      window.open(`https://wa.me/919000793333?text=${encodeURIComponent(message)}`, '_blank');
      cart = []; couponApplied = false; couponDiscount = 0; saveCart(); updateCartUI(); closeCartDrawer();
      showToast('Order placed! Check your WhatsApp');
      document.getElementById('checkoutName').value = '';
      document.getElementById('checkoutMobile').value = '';
      document.getElementById('checkoutAddress').value = '';
    });
  }
}

// ========== LOCATION AUTO-FILL ==========
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

// ========== SEARCH, COUPON, NEWSLETTER, ETC ==========
function initSearch() {
  const searchInput = document.getElementById('globalSearch');
  if (searchInput) searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || (p.telugu && p.telugu.toLowerCase().includes(query)));
    renderProducts(filtered);
  });
}
function initCoupon() {
  const applyBtn = document.getElementById('applyCoupon');
  if (applyBtn) applyBtn.addEventListener('click', () => {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    if (code === 'FRESH20') { couponApplied = true; couponDiscount = 20; showToast('🎉 20% off applied!'); }
    else if (code === 'WELCOME10') { couponApplied = true; couponDiscount = 10; showToast('🎉 10% off applied!'); }
    else { couponApplied = false; couponDiscount = 0; showToast('❌ Invalid coupon'); }
    updateDrawerTotals();
    document.getElementById('couponCode').value = '';
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
function initCopyCode() {
  const copyBtn = document.getElementById('copyCodeBtn');
  if (copyBtn) copyBtn.addEventListener('click', () => { navigator.clipboard.writeText('FRESH20'); showToast('Coupon code copied!'); });
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
  track.innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-avatar">${t.avatar}</div>
      <h4 class="testimonial-name">${t.name}</h4>
      <div class="testimonial-rating">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
      <p class="testimonial-text">"${t.text}"</p>
    </div>
  `).join('');
  initTestimonialSlider();
}
let currentSlide = 0, slideInterval;
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

// ========== ACCOUNT MODAL (Customer & Admin) ==========
function initAuth() {
  const desktopUserBtn = document.getElementById('userBtn');
  const mobileUserBtn = document.querySelector('.mobile-user');
  const modal = document.getElementById('accountModal');
  const closeModal = document.querySelector('#accountModal .close-modal');
  const customerEmailInput = document.getElementById('customerEmailInput');
  const customerLoginBtn = document.getElementById('customerLoginBtn');
  const adminLoginBtn = document.getElementById('adminLoginBtn');

  const updateUserUI = () => {
    const user = localStorage.getItem('greenmart_user');
    const displayName = user ? user.split('@')[0] : 'Account';
    const btnHtml = user ? `<i class="fas fa-user-check"></i><span>Hi, ${displayName}</span>` : `<i class="far fa-user-circle"></i><span>Account</span>`;
    if (desktopUserBtn) desktopUserBtn.innerHTML = btnHtml;
    if (mobileUserBtn) mobileUserBtn.innerHTML = btnHtml;
  };

  const showModal = () => { modal.style.display = 'flex'; };
  const closeModalFunc = () => { modal.style.display = 'none'; };

  const handleCustomerLogin = () => {
    const email = customerEmailInput.value.trim();
    if (email && email.includes('@')) {
      localStorage.setItem('greenmart_user', email);
      closeModalFunc();
      updateUserUI();
      location.reload();
    } else {
      alert('Please enter a valid email address');
    }
  };

  const handleAdminLogin = () => {
    window.location.href = 'admin-login.html';
  };

  if (desktopUserBtn) desktopUserBtn.addEventListener('click', showModal);
  if (mobileUserBtn) mobileUserBtn.addEventListener('click', showModal);
  if (closeModal) closeModal.addEventListener('click', closeModalFunc);
  if (customerLoginBtn) customerLoginBtn.addEventListener('click', handleCustomerLogin);
  if (adminLoginBtn) adminLoginBtn.addEventListener('click', handleAdminLogin);
  window.addEventListener('click', (e) => { if (e.target === modal) closeModalFunc(); });

  updateUserUI();
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  loadCart();
  loadWishlist();
  setupGlobalEventDelegation();
  initSearch();
  initCoupon();
  initAuth();
  initNewsletter();
  initCheckout();
  initCartDrawer();
  initMobileMenu();
  initSmoothScroll();
  initCTAScroll();
  initCopyCode();
  initLocationButton();
  renderTestimonials();
});
