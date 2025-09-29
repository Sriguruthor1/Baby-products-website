
/* Simple shared cart for all pages - stored in localStorage */
(function(){
  const CART_KEY = "site_cart_v1";

  function loadCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; } }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function currency(n){ n = Number(n||0); return n.toFixed(2); }

  function inferProductData(el){
    // Attempt to infer product details from data-* attributes or nearby DOM
    const data = {};
    const srcEl = el.closest('[data-product]') || el.closest('.product') || el.closest('.card') || el;
    data.id = el.getAttribute('data-id') || srcEl?.getAttribute('data-id') || String(Date.now());
    data.name = el.getAttribute('data-name') || srcEl?.getAttribute('data-name') || (srcEl?.querySelector('.title, .name, h3, h4, .product-title')?.textContent?.trim()) || document.title || "Item";
    const priceAttr = el.getAttribute('data-price') || srcEl?.getAttribute('data-price') || (srcEl?.querySelector('.price, .product-price')?.textContent||"").replace(/[^0-9.]/g,'') || "0";
    data.price = parseFloat(priceAttr) || 0;
    const imgEl = srcEl?.querySelector('img');
    data.image = el.getAttribute('data-image') || srcEl?.getAttribute('data-image') || (imgEl ? imgEl.getAttribute('src') : "");
    return data;
  }

  function addToCartFromElement(el){
    const item = inferProductData(el);
    const cart = loadCart();
    // If same id exists, increase quantity
    const idx = cart.findIndex(x => x.id === item.id && item.id);
    if (idx >= 0) { cart[idx].qty = (cart[idx].qty || 1) + 1; }
    else { item.qty = 1; cart.push(item); }
    saveCart(cart);
    notify("Added to cart: " + item.name);
    updateCartBadge();
  }

  function notify(msg){
    try {
      // Toast-like simple UI
      let t = document.createElement('div');
      t.textContent = msg;
      t.style.position = 'fixed'; t.style.bottom = '20px'; t.style.right = '20px';
      t.style.padding = '10px 14px'; t.style.background = '#111'; t.style.color = '#fff'; t.style.borderRadius = '10px';
      t.style.boxShadow = '0 4px 12px rgba(0,0,0,.2)'; t.style.zIndex = '9999';
      document.body.appendChild(t);
      setTimeout(()=> t.remove(), 1600);
    } catch(e){ console.log(msg); }
  }

  function updateCartBadge(){
    const cart = loadCart();
    const count = cart.reduce((a,b)=>a+(b.qty||1),0);
    document.querySelectorAll('[data-cart-count], .cart-count, #cart-count').forEach(el => { el.textContent = count; });
  }

  function attachHandlers(){
    document.querySelectorAll('[data-add-to-cart], .add-to-cart').forEach(el => {
      if (el.dataset._bound_add) return;
      el.dataset._bound_add = "1";
      el.addEventListener('click', (e)=>{
        e.preventDefault();
        addToCartFromElement(el);
      });
    });
    document.querySelectorAll('[data-pay-now], .pay-now').forEach(el => {
      if (el.dataset._bound_pay) return;
      el.dataset._bound_pay = "1";
      el.addEventListener('click', (e)=>{
        e.preventDefault();
        window.location.href = 'checkout.html';
      });
    });
  }

  function initCheckoutPage(){
    if (!/checkout\.html?$/i.test(location.pathname)) return;
    const container = document.querySelector('#checkout-items') || document.body;
    const cart = loadCart();
    const list = document.createElement('div');
    let total = 0;
    cart.forEach(item => {
      const lineTotal = (item.qty||1) * (item.price||0);
      total += lineTotal;
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '60px 1fr auto auto';
      row.style.gap = '12px';
      row.style.alignItems = 'center';
      row.style.padding = '8px 0';
      row.innerHTML = `
        <img src="${item.image || ''}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #eee" />
        <div>
          <div style="font-weight:600">${item.name}</div>
          <div style="font-size:12px;opacity:.7">Price: ₹${currency(item.price)} × ${item.qty||1}</div>
        </div>
        <div>₹${currency(lineTotal)}</div>
        <button class="remove" style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer">Remove</button>
      `;
      row.querySelector('.remove').addEventListener('click', ()=>{
        const c = loadCart().filter(x => x.id !== item.id);
        saveCart(c); location.reload();
      });
      list.appendChild(row);
    });
    const totalEl = document.createElement('div');
    totalEl.style.textAlign = 'right';
    totalEl.style.fontWeight = '700';
    totalEl.style.marginTop = '10px';
    totalEl.textContent = "Total: ₹" + currency(total);
    container.appendChild(list);
    container.appendChild(totalEl);

    const payBtn = document.querySelector('#proceed-payment') || (function(){
      const b = document.createElement('button');
      b.id = 'proceed-payment';
      b.textContent = 'Proceed to Payment';
      b.style.marginTop = '16px';
      b.style.padding = '10px 14px';
      b.style.border = '0'; b.style.borderRadius = '10px'; b.style.background = '#0a7'; b.style.color = '#fff';
      container.appendChild(b);
      return b;
    })();
    payBtn.addEventListener('click', ()=>{
      // mock payment success
      saveCart([]);
      alert('Payment Successful ✅');
      window.location.href = 'thankyou.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    attachHandlers();
    updateCartBadge();
    initCheckoutPage();
    // Observe DOM for dynamically added buttons
    const obs = new MutationObserver(()=> attachHandlers());
    obs.observe(document.body, {childList:true, subtree:true});
  });
})();