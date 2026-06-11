/**
 * GREEN MART KAKINADA – MAIN WEBSITE (Firestore version)
 * All existing cart, wishlist, checkout, location functions remain the same.
 * Only the product loading is changed to fetch from Firestore.
 */

let products = [];
let cart = [];
let wishlist = [];
let couponApplied = false;
let couponDiscount = 0;
const DELIVERY_FEE_THRESHOLD = 499;
const DELIVERY_FEE = 40;

// ========== FEATURES & TESTIMONIALS (static) ==========
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
const productEmojis = {
  "Spinach": "🥬", "Fenugreek Leaves": "🌿", "Amaranthus": "🌿", "Sorrel Leaves": "🥬",
  "Potato": "🥔", "Carrot": "🥕", "Onion": "🧅", "Tomato": "🍅", "Mushroom": "🍄",
  "Cucumber": "🥒", "Capsicum": "🫑", "Broccoli": "🥦", "Cauliflower": "🥦",
  "Beans": "🫘", "Peas": "🟢", "Ginger": "🫚", "Garlic": "🧄"
};

// ========== LOAD PRODUCTS FROM FIRESTORE ==========
async function loadProducts() {
  try {
    const querySnapshot = await db.collection('products').get();
    products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Loaded ${products.length} products from Firestore`);
  } catch (error) {
    console.error('Firestore error:', error);
    products = []; // fallback empty
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
  const icons = { 'Leafy Vegetables': '🥬', 'Root Vegetables': '🥕', 'Flower Vegetables': '🥦', 'Fruit Vegetables': '🍆', 'Stem Vegetables': '🌿', 'Bulb Vegetables': '🧅', 'Seed / Pod Vegetables': '🫘', 'Exotic / International': '🌍' };
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
      <div class="product-image"><div style="font-size:80px; display:flex; align-items:center; justify-content:center; height:220px; background:#f3f4f6;">${product.emoji}</div>${!product.available ? '<div class="out-of-stock">Out of Stock</div>' : ''}
      <div class="wishlist-icon ${wishlist.includes(product.id) ? 'active' : ''}" data-id="${product.id}"><i class="far fa-heart"></i></div></div>
      <div class="product-info"><div class="product-category">${product.category}</div><div class="product-name">${product.name}</div><div class="product-name-telugu">${product.telugu}</div>
      <div class="product-rating"><div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</div><div class="review-count">(${product.reviews})</div></div>
      <div class="product-price-row"><span class="current-price">₹${product.price}</span><span class="original-price">₹${product.originalPrice}</span><span class="discount-badge">${product.discount}% OFF</span></div>
      <div class="product-unit">Per ${product.unit}</div>
      <div class="quantity-add"><input type="number" id="qty-${product.id}" class="product-quantity" min="0.5" step="0.5" value="1"><button class="add-to-cart-btn" data-id="${product.id}" ${!product.available ? 'disabled' : ''}>${product.available ? 'Add to Cart' : 'Out of Stock'}</button></div>
      <button class="quickview-btn" data-id="${product.id}">Quick View</button></div>
    </div>`).join('');
  attachProductEventListeners();
}
function attachProductEventListeners() {
  // All event listeners are already attached globally via delegation, but we reattach if needed
}

// ========== CART & WISHLIST (same as before – keep your existing functions) ==========
// ... (paste your original cart, wishlist, checkout, location, search, etc. functions here)
// They are exactly the same as in your current working script.js.
// To avoid duplication, I will not rewrite them – use your existing code.

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  loadCart();      // your existing loadCart function
  loadWishlist();  // your existing loadWishlist
  setupGlobalEventDelegation(); // your existing function
  initSearch(); initCoupon(); initAuth(); initNewsletter(); initCheckout(); initCartDrawer();
  initMobileMenu(); initSmoothScroll(); initCTAScroll(); initCopyCode(); initLocationButton();
  renderTestimonials();
});
