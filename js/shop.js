const CART_KEY = "cjr203-bf-cart-v2";
const $ = (id) => document.getElementById(id);
const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PCT = Math.round(DISCOUNT * 100);
const SKU = Object.fromEntries(INVENTORY.map((s) => [s.sku, s]));
const remaining = Object.fromEntries(INVENTORY.map((s) => [s.sku, s.stock]));
const stickFilter = { hand: "", level: "", flex: "", curve: "" };
let cart = loadCart();
let step = "cart";

const isClosed = () => Date.now() > DEADLINE;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((l) => SKU[l.sku] && l.qty > 0) : [];
  } catch (e) {
    return [];
  }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { return; }
}

function inCart(sku) {
  return cart.filter((x) => x.sku === sku).reduce((n, x) => n + x.qty, 0);
}
function propsText(p) {
  return p ? `Back: ${p.name} #${p.number}` : "";
}
function left(sku) {
  const r = remaining[sku];
  return r == null ? Infinity : Math.max(0, r - inCart(sku));
}
function inStock(s) {
  return remaining[s.sku] == null || remaining[s.sku] > 0;
}
function attrText(attr, v) {
  return attr === "name" ? shortName(v) : v;
}

function tagHtml() {
  return `<div class="hang" aria-hidden="true">
      <svg width="120" height="60"><path d="M59 9 C 52 27, 44 37, 66 48" fill="none" stroke="#B9B4B2" stroke-width="2"/><path d="M59 9 C 72 27, 84 34, 72 48" fill="none" stroke="#B9B4B2" stroke-width="2"/></svg>
      <span class="nail"></span>
      <div class="tag"><b>Black<br>Friday</b><i class="pct">${PCT}% off</i></div>
    </div>`;
}

function priceHtml(skus, chosen) {
  const off = `<span class="off">${PCT}% off</span>`;
  const soon = '<span class="soon">Price coming soon</span>';
  if (skus.length && skus.every((s) => s.flat)) {
    const s = chosen || skus.find((x) => x.regular != null);
    if (!s || s.regular == null) return soon;
    return `${chosen ? "" : '<span class="from">From</span>'}<span class="now">${money(s.regular)}</span>`;
  }
  if (chosen) {
    if (chosen.regular == null) return off + soon;
    const r = remaining[chosen.sku];
    const few = r != null && r <= 10 ? `<span class="few">Only ${r} left</span>` : "";
    return `<span class="now">${money(salePrice(chosen.regular))}</span><span class="was">${money(chosen.regular)}</span>${off}${few}`;
  }
  const priced = skus.filter((s) => s.regular != null).map((s) => s.regular);
  if (priced.length) return `<span class="from">From</span><span class="now">${money(salePrice(Math.min(...priced)))}</span>${off}`;
  return off + soon;
}

function cardSkus(card) {
  return INVENTORY.filter((s) => s.group === card.id && inStock(s));
}
function matching(card, vals, upto) {
  return cardSkus(card).filter((s) => card.picker.slice(0, upto).every(([a], k) => !vals[k] || s[a] === vals[k]));
}
function choicesFor(card, vals, i) {
  return [...new Set(matching(card, vals, i).map((s) => s[card.picker[i][0]]))];
}
function optionsHtml(card, vals, i) {
  return `<option value="">Choose</option>${choicesFor(card, vals, i).map((v) => `<option value="${esc(v)}">${esc(attrText(card.picker[i][0], v))}</option>`).join("")}`;
}

function cardParts(c) {
  return {
    img: `<img src="${c.image}" alt="${esc(c.name)}" loading="lazy" decoding="async">`,
    tag: c.flat ? "" : tagHtml(),
    price: `<div class="price" aria-live="polite">${priceHtml(cardSkus(c), null)}</div>`,
    opts: `<div class="opts">${c.picker.map(([a, label], i) => `<div class="field full"><label for="${c.id}-${a}">${esc(label)}</label><select id="${c.id}-${a}" data-i="${i}"${i ? " disabled" : ""}>${i ? `<option value="">Choose ${esc(c.picker[i - 1][1].toLowerCase())} first</option>` : optionsHtml(c, [], 0)}</select></div>`).join("")}${customHtml(c)}</div>`,
    err: '<p class="err" aria-live="polite"></p>',
    add: `<button class="addbtn add" type="button"${isClosed() ? " disabled" : ""}>Add to cart</button>`
  };
}

function customHtml(c) {
  const skus = INVENTORY.filter((s) => s.group === c.id);
  if (!skus.some((s) => s.custom)) return "";
  return `<div class="custom field full${skus.every((s) => s.custom) ? "" : " hidden"}">
      <p class="custom-note">For the jersey on the back</p>
      <div class="custom-row">
        <div class="field"><label for="${c.id}-pname">Player last name</label><input id="${c.id}-pname" data-c="name" maxlength="14" autocomplete="off" spellcheck="false" placeholder="SMITH"></div>
        <div class="field"><label for="${c.id}-pnum">Number</label><input id="${c.id}-pnum" data-c="number" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="19"></div>
      </div>
    </div>`;
}

function defaultCard(c, p) {
  return `<article class="card" data-id="${c.id}">
      <div class="scene"><div class="photo${c.dark ? " dark" : ""}">${p.img}</div>${p.tag}</div>
      <div class="body"><span class="cat">${esc(c.tag)}</span><h3>${esc(c.name)}</h3><p class="desc">${esc(c.description)}</p>${p.price}${p.opts}${p.err}${p.add}</div>
    </article>`;
}

function renderGear() {
  const tpl = (window.SHOP_THEME && window.SHOP_THEME.card) || defaultCard;
  const gifts = $("gifts");
  const html = (list) => list.map((c) => tpl(c, cardParts(c))).join("");
  $("grid").innerHTML = html(CARDS.filter((c) => c.picker && !(gifts && c.flat)));
  if (gifts) gifts.innerHTML = html(CARDS.filter((c) => c.picker && c.flat));
}

function cardValues(cardEl) {
  return [...cardEl.querySelectorAll("[data-i]")].map((e) => e.value);
}
function selectedSku(cardEl, card) {
  const vals = cardValues(cardEl);
  if (vals.some((v) => !v)) return null;
  return cardSkus(card).find((s) => card.picker.every(([a], k) => s[a] === vals[k])) || null;
}

function onPick(cardEl, el) {
  const card = CARDS.find((c) => c.id === cardEl.dataset.id);
  const i = +el.dataset.i;
  const selects = [...cardEl.querySelectorAll("[data-i]")];
  if (el.value) el.closest(".field").classList.remove("bad");
  for (let k = i + 1; k < selects.length; k++) {
    const vals = cardValues(cardEl);
    const ready = selects.slice(0, k).every((s) => s.value);
    selects[k].disabled = !ready;
    selects[k].innerHTML = ready ? optionsHtml(card, vals, k) : `<option value="">Choose ${esc(card.picker[k - 1][1].toLowerCase())} first</option>`;
  }
  const vals = cardValues(cardEl);
  const img = cardEl.querySelector(".photo img, .pic img");
  if (card.images && img) img.src = card.images[vals[0]] || card.image;
  const chosen = selectedSku(cardEl, card);
  const box = cardEl.querySelector(".custom");
  if (box) box.classList.toggle("hidden", !(chosen && chosen.custom));
  cardEl.querySelector(".price").innerHTML = priceHtml(matching(card, vals, card.picker.length), selectedSku(cardEl, card));
}

function addGear(cardEl) {
  const card = CARDS.find((c) => c.id === cardEl.dataset.id);
  const err = cardEl.querySelector(".err");
  const missing = [];
  cardEl.querySelectorAll("[data-i]").forEach((sel, k) => {
    sel.closest(".field").classList.toggle("bad", !sel.value);
    if (!sel.value) missing.push(card.picker[k][1]);
  });
  if (missing.length) {
    err.textContent = `Please choose: ${missing.join(", ")}`;
    return;
  }
  const s = selectedSku(cardEl, card);
  if (!s) return;
  let props = null;
  if (s.custom) {
    const nameEl = cardEl.querySelector('[data-c="name"]');
    const numEl = cardEl.querySelector('[data-c="number"]');
    const name = nameEl.value.trim().replace(/\s+/g, " ").toUpperCase();
    const number = numEl.value.trim();
    const nameOk = /^[A-Z][A-Z .'-]{0,13}$/.test(name);
    const numOk = /^\d{1,2}$/.test(number);
    nameEl.closest(".field").classList.toggle("bad", !nameOk);
    numEl.closest(".field").classList.toggle("bad", !numOk);
    if (!nameOk || !numOk) {
      err.textContent = !nameOk ? "Please type the player's last name (letters only)." : "Please type a jersey number (1 or 2 digits).";
      return;
    }
    props = { name, number };
    nameEl.value = "";
    numEl.value = "";
  }
  err.textContent = "";
  addSku(s.sku, props);
}

function addSku(sku, props) {
  if (isClosed()) { toast("Orders are closed"); return; }
  if (left(sku) < 1) { toast("That is all we have in stock"); return; }
  const key = JSON.stringify(props || null);
  const line = cart.find((l) => l.sku === sku && JSON.stringify(l.props || null) === key);
  if (line) line.qty += 1;
  else cart.push(props ? { sku, qty: 1, props } : { sku, qty: 1 });
  saveCart();
  renderCart();
  renderSticks();
  const btn = $("openCart");
  btn.classList.remove("bump");
  void btn.offsetWidth;
  btn.classList.add("bump");
  toast(`${SKU[sku].name}${props ? ` (${props.name} #${props.number})` : ""} added to your cart`);
}

function stickSkus() {
  return INVENTORY.filter((s) => s.group === "sticks" && inStock(s));
}
function stickMatches(except) {
  return stickSkus().filter((s) => Object.keys(stickFilter).every((k) => k === except || !stickFilter[k] || String(s[k]) === stickFilter[k]));
}
const LEVEL_ORDER = ["Youth", "Junior", "Intermediate", "Senior"];
function filterOptions(key) {
  let vals = [...new Set(stickMatches(key).map((s) => String(s[key])).filter(Boolean))];
  if (key === "level") vals.sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  else if (key === "flex") vals.sort((a, b) => a - b);
  else vals.sort();
  if (stickFilter[key] && !vals.includes(stickFilter[key])) vals.unshift(stickFilter[key]);
  return vals;
}

function renderSticks() {
  const units = stickSkus().reduce((n, s) => n + (remaining[s.sku] || 0), 0);
  $("stickCount").textContent = `${units} sticks in stock right now, right and left.`;
  const labels = { hand: "Hand", level: "Size", flex: "Flex", curve: "Curve" };
  $("stickFilters").innerHTML = Object.keys(labels).map((k) => {
    const opts = (k === "hand" ? ["Left", "Right"] : filterOptions(k)).map((v) => `<option value="${esc(v)}"${stickFilter[k] === v ? " selected" : ""}>${esc(k === "flex" ? v + " flex" : v)}</option>`).join("");
    return `<div class="field"><label for="sf-${k}">${labels[k]}</label><select id="sf-${k}" data-filter="${k}"><option value="">${k === "hand" ? "Choose" : "Any"}</option>${opts}</select></div>`;
  }).join("");
  if (!stickFilter.hand) {
    $("stickList").innerHTML = '<p class="hint">Choose Left or Right to see the sticks in stock.</p>';
    return;
  }
  const rows = stickMatches().sort((a, b) => a.name.localeCompare(b.name) || LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || a.flex - b.flex || a.curve.localeCompare(b.curve));
  const count = rows.reduce((n, s) => n + remaining[s.sku], 0);
  $("stickList").innerHTML = `<p class="hint">${count} ${count === 1 ? "stick matches" : "sticks match"}</p>` + rows.map((s) => {
    const l = left(s.sku);
    const price = s.regular == null
      ? '<span class="soon">Price coming soon</span>'
      : `<b>${money(salePrice(s.regular))}</b><s>${money(s.regular)}</s>`;
    const bits = [s.level, `${s.flex} flex`, s.curve].filter(Boolean).join(" / ");
    return `<div class="srow">
      <div class="sname"><b>${esc(s.name)}</b><span>${esc(bits)}</span></div>
      <div class="sprice">${price}</div>
      <div class="sleft">${remaining[s.sku]} left</div>
      <button class="addbtn mini" type="button" data-add="${s.sku}"${l < 1 || isClosed() ? " disabled" : ""}>${l < 1 ? "In cart" : "Add"}</button>
    </div>`;
  }).join("");
}

function lineUnit(l) {
  const s = SKU[l.sku];
  return { reg: s.regular, sale: unitPrice(s) };
}

function totals() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const unpriced = cart.some((l) => lineUnit(l).sale == null);
  const sum = cart.reduce((n, l) => n + (lineUnit(l).sale || 0) * l.qty, 0);
  const regular = cart.reduce((n, l) => n + (lineUnit(l).reg || 0) * l.qty, 0);
  return { count, unpriced, sum, saved: regular - sum };
}

function renderCart() {
  const t = totals();
  $("cartCount").textContent = t.count;
  $("lines").innerHTML = cart.length ? cart.map((l, i) => {
    const s = SKU[l.sku];
    const card = CARDS.find((c) => c.id === s.group);
    const img = (card.images && (card.images[s.name] || card.images[s.level])) || card.image;
    const u = lineUnit(l);
    const amt = u.sale == null ? "Price soon" : `${money(u.sale * l.qty)}${u.sale < u.reg ? `<s>${money(u.reg * l.qty)}</s>` : ""}`;
    return `<div class="line">
      <img src="${img}" alt=""${card.dark ? ' class="dark"' : ""}>
      <div><h5>${esc(s.name)}</h5><p class="meta">${esc(s.details)}${l.props ? `<br><b class="props">${esc(propsText(l.props))}</b>` : ""}</p>
        <div class="qty"><button type="button" data-q="-1" data-i="${i}" aria-label="One less">&minus;</button><span>${l.qty}</span><button type="button" data-q="1" data-i="${i}" aria-label="One more"${left(l.sku) < 1 ? " disabled" : ""}>+</button></div>
        <button class="remove" type="button" data-rm="${i}">Remove</button>
      </div>
      <div class="amt">${amt}</div>
    </div>`;
  }).join("") : '<p class="empty">Your cart is empty.</p>';
  $("total").innerHTML = !cart.length ? money(0) : t.unpriced
    ? (t.sum ? `${money(t.sum)} <span class="tba">+ items to confirm</span>` : '<span class="tba">Confirmed by email</span>')
    : money(t.sum);
  $("saved").textContent = t.saved > 0 ? `You save ${money(t.saved)} with code ${PROMO_CODE} (${PCT}% off)` : "";
  const off = offlineLines();
  $("offNote").classList.toggle("hidden", !(step === "info" && off.length && onlineLines().length));
  $("offNote").innerHTML = off.length ? `<b>Not in the online checkout yet:</b> ${off.map((l) => esc(lineText(l))).join("; ")}. These are added to your order as a note and the 203 Hockey Shop confirms them with you.` : "";
  $("footNote").textContent = step === "info"
    ? (onlineLines().length
      ? `Next you pay on the 203 Hockey Shop checkout. Code ${PROMO_CODE} is added for you.`
      : `Code ${PROMO_CODE} is on your order. Nothing is charged today. We confirm your order and payment by email.`)
    : (t.unpriced && cart.length ? "Prices still to come are confirmed by email before anything is charged." : `Order by ${DEADLINE_TEXT}.`);
  $("nextBtn").disabled = !cart.length || isClosed();
}

function setStep(s) {
  step = s;
  $("stepCart").classList.toggle("hidden", s !== "cart");
  $("stepInfo").classList.toggle("hidden", s !== "info");
  $("stepDone").classList.toggle("hidden", s !== "done");
  $("foot").classList.toggle("hidden", s === "done");
  $("backBtn").classList.toggle("hidden", s !== "info");
  $("nextBtn").textContent = s === "info" ? (onlineLines().length ? "Continue to checkout" : "Place order") : "Continue";
  $("drawerTitle").textContent = s === "cart" ? "Your Cart" : s === "info" ? "Your Info" : "Thank You";
  [...$("steps").children].forEach((li, i) => li.classList.toggle("on", i <= ["cart", "info", "done"].indexOf(s)));
  renderCart();
  $("drawer").querySelector(".scroll").scrollTop = 0;
}

function openCart() {
  $("drawer").classList.add("open");
  $("scrim").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  if (step === "done") setStep("cart");
}
function closeCart() {
  $("drawer").classList.remove("open");
  $("scrim").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
}

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function validateInfo(form) {
  let firstBad = null;
  form.querySelectorAll("input[required], select[required]").forEach((el) => {
    let ok = el.value.trim() !== "";
    if (ok && el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
    if (ok && el.type === "tel") ok = el.value.replace(/\D/g, "").length >= 10;
    if (ok && el.type === "date") ok = el.value >= todayIso();
    el.closest(".field").classList.toggle("bad", !ok);
    if (!ok && !firstBad) firstBad = el;
  });
  return firstBad;
}

function orderNumber() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `BF-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function applyStock(stock) {
  Object.keys(stock || {}).forEach((k) => { if (k in remaining && stock[k] !== "" && stock[k] != null) remaining[k] = Math.max(0, +stock[k]); });
  cart = cart.filter((l) => {
    if (remaining[l.sku] != null && l.qty > remaining[l.sku]) l.qty = remaining[l.sku];
    return l.qty > 0;
  });
  saveCart();
  renderGear();
  renderSticks();
  renderCart();
}

async function sendOrder(payload) {
  if (!ORDER_URL) {
    try {
      const saved = JSON.parse(localStorage.getItem("cjr203-preview-orders") || "[]");
      saved.push(payload);
      localStorage.setItem("cjr203-preview-orders", JSON.stringify(saved));
    } catch (e) { return { ok: true, preview: true }; }
    return { ok: true, preview: true };
  }
  const res = await fetch(ORDER_URL, { method: "POST", body: JSON.stringify(payload) });
  return res.json();
}

function onlineLines() {
  return SHOP_CHECKOUT ? cart.filter((l) => SKU[l.sku].variant) : [];
}

function offlineLines() {
  return SHOP_CHECKOUT ? cart.filter((l) => !SKU[l.sku].variant) : [];
}

function lineText(l) {
  const s = SKU[l.sku];
  return `${l.qty} x ${s.name} (${s.details})${l.props ? ` ${propsText(l.props)}` : ""}`;
}

function shopifyUrl(p) {
  const items = onlineLines().map((l) => `${SKU[l.sku].variant}:${l.qty}`).join(",");
  const q = new URLSearchParams();
  q.set("discount", PROMO_CODE);
  q.set("checkout[email]", p.email);
  q.set("attributes[CJR order]", p.orderNumber);
  q.set("attributes[Parent]", `${p.parentFirst} ${p.parentLast}`);
  q.set("attributes[Phone]", p.phone);
  q.set("attributes[Player]", p.player);
  q.set("attributes[CJR team]", p.team);
  q.set("attributes[Pick up by]", p.pickupBy);
  const extra = offlineLines().map(lineText);
  const note = [p.notes, extra.length ? `Also ordered, not in the online checkout: ${extra.join("; ")}` : ""].filter(Boolean).join(" | ");
  if (note) q.set("note", note);
  return `${SHOP_CHECKOUT}/cart/${items}?${q.toString()}`;
}

async function placeOrder() {
  if (isClosed()) {
    $("formErr").textContent = "Orders are closed.";
    return;
  }
  const form = $("stepInfo");
  const bad = validateInfo(form);
  if (bad) {
    $("formErr").textContent = "Please fill in the highlighted boxes.";
    bad.focus();
    return;
  }
  $("formErr").textContent = "";
  const f = new FormData(form);
  const num = orderNumber();
  const payload = {
    orderNumber: num,
    parentFirst: f.get("parent_first_name").trim(),
    parentLast: f.get("parent_last_name").trim(),
    email: f.get("email").trim(),
    phone: f.get("phone").trim(),
    player: f.get("player_name").trim(),
    team: f.get("player_team").trim(),
    pickupBy: f.get("pickup_by"),
    notes: (f.get("notes") || "").trim(),
    emailUpdates: f.get("email_updates") ? "Yes" : "No",
    discountCode: PROMO_CODE,
    items: cart.map((l) => (l.props ? { sku: l.sku, qty: l.qty, props: l.props } : { sku: l.sku, qty: l.qty }))
  };
  if (onlineLines().length) {
    $("nextBtn").disabled = true;
    $("nextBtn").textContent = "Opening checkout...";
    location.href = shopifyUrl(payload);
    return;
  }
  $("nextBtn").disabled = true;
  $("nextBtn").textContent = "Sending...";
  try {
    const r = await sendOrder(payload);
    if (!r.ok) {
      if (r.stock) applyStock(r.stock);
      $("formErr").textContent = r.error || "Your order did not go through. Please try again.";
      $("nextBtn").disabled = false;
      $("nextBtn").textContent = "Place order";
      return;
    }
    cart.forEach((l) => { if (remaining[l.sku] != null) remaining[l.sku] -= l.qty; });
    cart = [];
    saveCart();
    form.reset();
    $("doneNum").textContent = `Order ${r.orderNumber || num}`;
    $("donePreview").classList.toggle("hidden", !r.preview);
    setStep("done");
    renderGear();
    renderSticks();
  } catch (e) {
    $("formErr").textContent = "Your order did not go through. Please check your connection and try again.";
    $("nextBtn").disabled = false;
    $("nextBtn").textContent = "Place order";
  }
}

let toastTimer;
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function countdown() {
  if (!$("cells")) { if (isClosed()) document.body.classList.add("closed"); return; }
  const ms = DEADLINE - Date.now();
  if (ms <= 0) {
    $("cells").classList.add("hidden");
    $("saleOn").classList.remove("hidden");
    document.body.classList.add("closed");
    return;
  }
  const pad = (n) => String(n).padStart(2, "0");
  $("cdD").textContent = pad(Math.floor(ms / 86400000));
  $("cdH").textContent = pad(Math.floor(ms / 3600000) % 24);
  $("cdM").textContent = pad(Math.floor(ms / 60000) % 60);
  $("cdS").textContent = pad(Math.floor(ms / 1000) % 60);
}

function marquee() {
  if (!$("track")) return;
  const bit = `&#9733; Black Friday &#9733; ${PCT}% Off Everything &#9733; Code ${PROMO_CODE} &#9733; Order by Friday, Dec 25 &#9733; Holiday Gear Sale &#9733; 203 Sports Group x CJR Hockey `;
  const half = `<span>${bit.repeat(3)}</span>`;
  $("track").innerHTML = half + half;
}

[$("grid"), $("gifts")].filter(Boolean).forEach((box) => {
  box.addEventListener("click", (e) => {
    if (e.target.closest(".add")) addGear(e.target.closest("[data-id]"));
  });
  box.addEventListener("change", (e) => {
    if (e.target.dataset.i != null) onPick(e.target.closest("[data-id]"), e.target);
  });
  box.addEventListener("input", (e) => {
    if (e.target.dataset.c) e.target.closest(".field").classList.remove("bad");
  });
});
$("stickFilters").addEventListener("change", (e) => {
  const k = e.target.dataset.filter;
  if (!k) return;
  stickFilter[k] = e.target.value;
  renderSticks();
});
$("stickList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]");
  if (b) addSku(b.dataset.add);
});
$("lines").addEventListener("click", (e) => {
  const q = e.target.closest("[data-q]");
  const rm = e.target.closest("[data-rm]");
  if (q) {
    const l = cart[+q.dataset.i];
    if (+q.dataset.q > 0 && left(l.sku) < 1) return;
    l.qty += +q.dataset.q;
    if (!l.qty) cart.splice(+q.dataset.i, 1);
  } else if (rm) {
    cart.splice(+rm.dataset.rm, 1);
  } else return;
  saveCart();
  renderCart();
  renderSticks();
});
$("stepInfo").addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("bad"));
$("stepInfo").addEventListener("submit", (e) => { e.preventDefault(); placeOrder(); });
$("nextBtn").addEventListener("click", () => (step === "cart" ? setStep("info") : placeOrder()));
$("backBtn").addEventListener("click", () => setStep("cart"));
$("openCart").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("scrim").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

$("f_pickup").min = todayIso();
$("f_pickup").addEventListener("click", (e) => { try { e.target.showPicker(); } catch (err) { e.target.focus(); } });
$("f_pickup").addEventListener("keydown", (e) => {
  if (e.key === "Tab" || e.key === "Escape") return;
  e.preventDefault();
  if (e.key === "Enter" || e.key === " ") { try { e.target.showPicker(); } catch (err) { e.target.focus(); } }
});
document.querySelectorAll("[data-deadline]").forEach((e) => { e.textContent = DEADLINE_TEXT; });
document.querySelectorAll("[data-code]").forEach((e) => { e.textContent = PROMO_CODE; });
document.querySelectorAll("[data-pct]").forEach((e) => { e.textContent = `${PCT}%`; });
marquee();
renderGear();
renderSticks();
setStep("cart");
countdown();
setInterval(countdown, 1000);
if (ORDER_URL) fetch(ORDER_URL + "?stock=1").then((r) => r.json()).then((d) => applyStock(d.stock)).catch(() => null);
