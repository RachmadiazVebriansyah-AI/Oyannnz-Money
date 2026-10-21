/* Oyannnz-Money — local-first finance tracker.
   Auth note: username/password and Google buttons are local demo flows.
   For production, connect a real identity provider and a secure backend. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DB_KEY = "oyannnz-money:v1";
  const AUTH_KEY = "oyannnz-money:session";
  const DEFAULT_POCKETS = [
    { id:"pocket-food", name:"Makan", icon:"♨", color:"greenish", builtin:true },
    { id:"pocket-needs", name:"Kebutuhan", icon:"⌂", color:"blueish", builtin:true },
    { id:"pocket-savings", name:"Tabungan", icon:"◈", color:"goldish", builtin:true },
    { id:"pocket-stocks", name:"Saham", icon:"↗", color:"blueish", builtin:true }
  ];
  const money = n => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits:0 }).format(Math.round(Number(n) || 0));
  const dateTime = value => new Intl.DateTimeFormat("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:false }).format(new Date(value));
  const dateShort = value => new Intl.DateTimeFormat("id-ID", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(value));
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const localDateTimeValue = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0,16);
  };

  let db = loadDB();
  let currentUser = null;
  let authMode = "login";
  let activePage = "overview";
  let toastTimer;
  let confirmAction = null;
  let chosenPocketIcon = "◈";
  let selectedType = "expense";

  function loadDB() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEY));
      if (parsed && parsed.users && parsed.dataByUser) return parsed;
    } catch (error) { console.warn("Data lokal tidak dapat dibaca:", error); }
    return { users:{}, dataByUser:{} };
  }
  function saveDB() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (error) { toast("Penyimpanan gagal. Ruang browser mungkin penuh.", "error"); }
  }
  function defaultData() {
    return { pockets: structuredClone(DEFAULT_POCKETS), transactions:[] };
  }
  function ensureUserData(username) {
    if (!db.dataByUser[username]) db.dataByUser[username] = defaultData();
    if (!Array.isArray(db.dataByUser[username].pockets)) db.dataByUser[username].pockets = structuredClone(DEFAULT_POCKETS);
    if (!Array.isArray(db.dataByUser[username].transactions)) db.dataByUser[username].transactions = [];
    return db.dataByUser[username];
  }
  function userData() { return ensureUserData(currentUser.username); }
  function pocketBalances() {
    const balances = Object.fromEntries(userData().pockets.map(p => [p.id, 0]));
    userData().transactions.forEach(t => { balances[t.pocketId] = (balances[t.pocketId] || 0) + (t.type === "income" ? t.amount : -t.amount); });
    return balances;
  }
  function totals() {
    const tx = userData().transactions;
    const income = tx.filter(t => t.type === "income").reduce((s,t)=>s+t.amount,0);
    const expense = tx.filter(t => t.type === "expense").reduce((s,t)=>s+t.amount,0);
    return { income, expense, balance:income-expense, net:income-expense };
  }
  function toast(message, type = "success") {
    const node = $("#toast"); node.textContent = message; node.className = `toast show ${type}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.className = "toast", 3000);
  }
  function showAuth() {
    $("#authScreen").classList.remove("hidden"); $("#appScreen").classList.add("hidden");
  }
  function showApp(username, mode = "local") {
    currentUser = { username, mode }; ensureUserData(username); saveDB();
    localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    $("#authScreen").classList.add("hidden"); $("#appScreen").classList.remove("hidden");
    $("#userDisplay").textContent = username; $("#userAvatar").textContent = username.slice(0,1).toUpperCase();
    $("#userRole").textContent = mode === "guest" ? "Guest · Demo mode" : "Local account";
    $("#todayLabel").textContent = new Intl.DateTimeFormat("id-ID", {weekday:"short",day:"2-digit",month:"short",year:"numeric"}).format(new Date());
    $("#year").textContent = new Date().getFullYear();
    renderAll();
  }
  function setAuthMode(mode) {
    authMode = mode;
    const login = mode === "login";
    $("#authTitle").textContent = login ? "Selamat datang kembali" : "Buat akun baru";
    $("#authSubtitle").textContent = login ? "Masuk untuk mengelola keuanganmu." : "Mulai kelola uangmu dengan lebih teratur.";
    $("#authSubmit").innerHTML = login ? 'Masuk ke dashboard <span>→</span>' : 'Buat akun <span>→</span>';
    $("#switchPrompt").textContent = login ? "Belum punya akun?" : "Sudah punya akun?";
    $("#switchAuth").textContent = login ? "Daftar sekarang" : "Masuk di sini";
    $("#password").autocomplete = login ? "current-password" : "new-password";
    $("#authError").textContent = "";
  }
  function authSubmit(event) {
    event.preventDefault();
    const username = $("#username").value.trim().toLowerCase();
    const password = $("#password").value;
    if (!/^[a-z0-9_.-]{3,24}$/.test(username)) { $("#authError").textContent = "Username 3–24 karakter: huruf, angka, titik, garis bawah, atau strip."; return; }
    if (password.length < 4) { $("#authError").textContent = "Password minimal 4 karakter."; return; }
    if (authMode === "register") {
      if (db.users[username]) { $("#authError").textContent = "Username sudah digunakan. Coba username lain."; return; }
      // Demo-only password storage. Never store plain-text passwords in production.
      db.users[username] = { password, createdAt:new Date().toISOString() };
      ensureUserData(username); saveDB(); showApp(username);
      toast("Akun lokal berhasil dibuat."); return;
    }
    if (!db.users[username] || db.users[username].password !== password) {
      $("#authError").textContent = "Username atau password tidak cocok."; return;
    }
    showApp(username); toast("Berhasil masuk.");
  }
  function signOut() {
    localStorage.removeItem(AUTH_KEY); currentUser = null; showAuth();
    $("#authForm").reset(); setAuthMode("login"); toast("Kamu sudah keluar.");
  }
  function goPage(page) {
    activePage = page;
    const names = { overview:["Overview","Ringkasan keuangan","Pantau kondisi keuanganmu hari ini."], transactions:["Transaksi","Riwayat transaksi","Semua pemasukan dan pengeluaranmu dalam satu tempat."], pockets:["Kantong uang","Kantong keuangan","Atur saldo sesuai pos dan prioritasmu."] };
    ["overview","transactions","pockets"].forEach(key => {
      $(`#${key}Page`).classList.toggle("hidden", key !== page);
      $(`[data-nav="${key}"]`).classList.toggle("active", key === page);
    });
    $("#pageName").textContent = names[page][0]; $("#pageTitle").textContent = names[page][1]; $("#pageSubtitle").textContent = names[page][2];
    if (page === "transactions") renderTransactions();
    if (page === "pockets") renderPockets();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderAll() { renderSummary(); renderPockets(); renderRecent(); renderTransactions(); renderPocketOptions(); renderChart(); }
  function renderSummary() {
    const t = totals(); const balances = pocketBalances();
    $("#totalBalance").textContent = money(t.balance); $("#totalIncome").textContent = money(t.income); $("#totalExpense").textContent = money(t.expense);
    $("#netFlow").textContent = money(t.net); $("#netFlow").style.color = t.net < 0 ? "var(--red)" : "var(--green)";
    $("#pocketGrid").innerHTML = userData().pockets.map(p => pocketCard(p, balances[p.id] || 0, false)).join("");
  }
  function pocketCard(p, balance, manage) {
    const safeName = escapeHTML(p.name);
    return `<article class="pocket-card"><div class="pocket-card-top"><div class="pocket-icon ${p.color || "blueish"}">${escapeHTML(p.icon || "◈")}</div>${manage && !p.builtin ? `<button class="pocket-delete" data-delete-pocket="${p.id}" title="Hapus kantong" aria-label="Hapus kantong ${safeName}">×</button>` : `<span class="pocket-dots">${p.builtin ? "· · ·" : "✦"}</span>`}</div><div class="pocket-name">${safeName}</div><div class="pocket-balance">${money(balance)}</div><div class="pocket-footer"><span>${userData().transactions.filter(t=>t.pocketId===p.id).length} transaksi</span><button data-pocket-add="${p.id}">＋ Catat</button></div></article>`;
  }
  function renderPockets() {
    const balances = pocketBalances();
    $("#pocketsManageGrid").innerHTML = userData().pockets.map(p => pocketCard(p, balances[p.id] || 0, true)).join("");
    $("#pocketFilter").innerHTML = '<option value="all">Semua kantong</option>' + userData().pockets.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join("");
    $("#pocketSelect").innerHTML = userData().pockets.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join("");
  }
  function renderPocketOptions() { renderPockets(); }
  function renderRecent() {
    const tx = [...userData().transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
    $("#recentTransactions").innerHTML = tx.length ? tx.map(transactionRow).join("") : `<div class="empty-inline">Belum ada transaksi. Mulai dengan mencatat uang masuk atau keluar.</div>`;
  }
  function transactionRow(t) {
    const p = userData().pockets.find(p=>p.id===t.pocketId);
    const income = t.type === "income";
    return `<div class="transaction-row"><div class="transaction-symbol ${t.type}">${income?"↙":"↗"}</div><div class="transaction-description"><strong>${escapeHTML(t.note)}</strong><span>${escapeHTML(p?.name || "Kantong dihapus")} · ${dateShort(t.date)}</span></div><div class="transaction-value ${t.type}">${income?"+":"−"} ${money(t.amount)}</div></div>`;
  }
  function renderTransactions() {
    const search = ($("#searchTransactions")?.value || "").trim().toLowerCase();
    const type = $("#typeFilter")?.value || "all"; const pocketId = $("#pocketFilter")?.value || "all";
    const tx = [...userData().transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).filter(t=>{
      const pocket = userData().pockets.find(p=>p.id===t.pocketId);
      return (type==="all"||t.type===type) && (pocketId==="all"||t.pocketId===pocketId) && (!search||`${t.note} ${pocket?.name||""}`.toLowerCase().includes(search));
    });
    $("#transactionTable").innerHTML = tx.map(t=>{
      const p = userData().pockets.find(p=>p.id===t.pocketId); const income = t.type==="income";
      return `<tr><td><div class="table-main"><div class="transaction-symbol ${t.type}">${income?"↙":"↗"}</div><div><strong>${escapeHTML(t.note)}</strong><span>${dateTime(t.date)}</span></div></div></td><td class="pocket-cell">${escapeHTML(p?.name||"Kantong dihapus")}</td><td>${dateShort(t.date)}</td><td><span class="type-pill ${t.type}">${income?"Pemasukan":"Pengeluaran"}</span></td><td class="table-amount ${t.type}">${income?"+":"−"} ${money(t.amount)}</td><td><button class="delete-row" data-delete-transaction="${t.id}" title="Hapus transaksi" aria-label="Hapus transaksi ${escapeHTML(t.note)}">×</button></td></tr>`;
    }).join("");
    $("#emptyTransactions").classList.toggle("hidden", tx.length > 0);
    $(".table-wrap").classList.toggle("hidden", tx.length === 0);
  }
  function renderChart() {
    const t = totals(); const max = Math.max(t.income,t.expense,1);
    $("#flowChart").innerHTML = `<div class="flow-bar-group"><div class="flow-bar income" style="height:${Math.max(3,t.income/max*100)}%" title="Pemasukan ${money(t.income)}"></div><div class="flow-bar expense" style="height:${Math.max(3,t.expense/max*100)}%" title="Pengeluaran ${money(t.expense)}"></div></div><div class="flow-bar-group"><div class="flow-bar income" style="height:${Math.max(3,t.income/max*75)}%"></div><div class="flow-bar expense" style="height:${Math.max(3,t.expense/max*75)}%"></div></div><div class="flow-bar-group"><div class="flow-bar income" style="height:${Math.max(3,t.income/max*88)}%"></div><div class="flow-bar expense" style="height:${Math.max(3,t.expense/max*88)}%"></div></div><div class="flow-bar-group"><div class="flow-bar income" style="height:${Math.max(3,t.income/max*63)}%"></div><div class="flow-bar expense" style="height:${Math.max(3,t.expense/max*63)}%"></div></div><div class="flow-bar-group"><div class="flow-bar income" style="height:${Math.max(3,t.income/max*80)}%"></div><div class="flow-bar expense" style="height:${Math.max(3,t.expense/max*80)}%"></div></div>`;
  }
  function openTransactionModal(pocketId = null) {
    if (!userData().pockets.length) { toast("Tambahkan kantong terlebih dahulu.", "error"); return; }
    $("#transactionForm").reset(); selectedType = "expense"; updateTypeToggle();
    $("#transactionType").value = selectedType; $("#transactionDate").value = localDateTimeValue();
    renderPocketOptions(); if (pocketId) $("#pocketSelect").value = pocketId;
    $("#transactionModal").classList.remove("hidden"); setTimeout(()=>$("#amountInput").focus(),50);
  }
  function closeTransactionModal() { $("#transactionModal").classList.add("hidden"); }
  function updateTypeToggle() {
    $$("[data-type]").forEach(btn=>btn.classList.toggle("selected",btn.dataset.type===selectedType));
    $("#transactionType").value = selectedType;
    $("#saveTransactionBtn").style.background = selectedType==="income" ? "var(--green)" : "var(--red)";
    $("#saveTransactionBtn").style.color = selectedType==="income" ? "#062218" : "#2a0710";
  }
  function submitTransaction(event) {
    event.preventDefault();
    const amount = Number($("#amountInput").value.replace(/\D/g,""));
    const pocketId = $("#pocketSelect").value; const note = $("#noteInput").value.trim(); const date = $("#transactionDate").value;
    if (!Number.isSafeInteger(amount) || amount <= 0) { toast("Masukkan nominal lebih dari Rp 0.", "error"); $("#amountInput").focus(); return; }
    if (!userData().pockets.some(p=>p.id===pocketId)) { toast("Pilih kantong yang valid.", "error"); return; }
    if (!note || !date || Number.isNaN(new Date(date).getTime())) { toast("Lengkapi keterangan dan tanggal.", "error"); return; }
    userData().transactions.push({id:id("tx"),type:selectedType,amount,pocketId,note,date:new Date(date).toISOString(),createdAt:new Date().toISOString()});
    saveDB(); closeTransactionModal(); renderAll(); toast("Transaksi berhasil disimpan."); if(activePage==="transactions") renderTransactions();
  }
  function deleteTransaction(transactionId) {
    const tx = userData().transactions.find(t=>t.id===transactionId); if (!tx) return;
    confirmDialog("Hapus transaksi ini?", `Transaksi “${tx.note}” sebesar ${money(tx.amount)} akan dihapus. Saldo kantong dan total akan dihitung ulang.`, "Ya, hapus", ()=>{
      userData().transactions = userData().transactions.filter(t=>t.id!==transactionId); saveDB(); renderAll(); toast("Transaksi dihapus dan saldo diperbarui.");
    }, "danger");
  }
  function clearHistory() {
    if (!userData().transactions.length) { toast("Riwayat transaksi masih kosong.", "error"); return; }
    confirmDialog("Hapus semua riwayat?", "Apakah Anda yakin ingin menghapus seluruh riwayat transaksi? Semua saldo kantong dihitung ulang dari riwayat, sehingga akan kembali ke Rp 0. Tindakan ini tidak dapat dibatalkan.", "Ya, hapus semua", ()=>{
      userData().transactions = []; saveDB(); renderAll(); toast("Semua riwayat transaksi telah dihapus.");
    }, "danger");
  }
  function openPocketModal() { $("#pocketForm").reset(); chosenPocketIcon="◈"; $("#pocketIconInput").value=chosenPocketIcon; $$(".icon-choice").forEach(b=>b.classList.toggle("selected",b.dataset.icon===chosenPocketIcon)); $("#pocketModal").classList.remove("hidden"); setTimeout(()=>$("#pocketNameInput").focus(),50); }
  function submitPocket(event) {
    event.preventDefault(); const name=$("#pocketNameInput").value.trim();
    if(name.length<2){toast("Nama kantong minimal 2 karakter.","error");return;}
    if(userData().pockets.some(p=>p.name.toLowerCase()===name.toLowerCase())){toast("Nama kantong sudah ada.","error");return;}
    const colors=["greenish","blueish","goldish"]; userData().pockets.push({id:id("pocket"),name,icon:chosenPocketIcon,color:colors[userData().pockets.length%colors.length],builtin:false});
    saveDB(); $("#pocketModal").classList.add("hidden"); renderAll(); toast(`Kantong “${name}” berhasil dibuat.`);
  }
  function deletePocket(pocketId) {
    const p=userData().pockets.find(p=>p.id===pocketId); if(!p||p.builtin)return;
    const used=userData().transactions.some(t=>t.pocketId===pocketId);
    if(used){toast("Kantong ini punya riwayat transaksi. Hapus transaksinya terlebih dahulu.","error");return;}
    confirmDialog("Hapus kantong ini?",`Kantong “${p.name}” akan dihapus.`, "Ya, hapus kantong",()=>{
      userData().pockets=userData().pockets.filter(x=>x.id!==pocketId);saveDB();renderAll();toast("Kantong dihapus.");
    },"danger");
  }
  function confirmDialog(title,message,accept,action,kind="danger") {
    $("#confirmTitle").textContent=title;$("#confirmMessage").textContent=message;$("#acceptConfirm").textContent=accept;confirmAction=action;
    $("#acceptConfirm").className=kind==="danger"?"danger-btn":"primary-btn";$("#confirmModal").classList.remove("hidden");
  }
  function closeConfirm(){ $("#confirmModal").classList.add("hidden");confirmAction=null; }
  function bindEvents() {
    $("#authForm").addEventListener("submit",authSubmit);
    $("#switchAuth").addEventListener("click",()=>setAuthMode(authMode==="login"?"register":"login"));
    $("#togglePassword").addEventListener("click",()=>{const input=$("#password");input.type=input.type==="password"?"text":"password";});
    $("#guestBtn").addEventListener("click",()=>showApp("guest-demo","guest"));
    $("#googleBtn").addEventListener("click",()=>toast("Login Google belum dikonfigurasi. Gunakan akun lokal atau Guest mode.","error"));
    $("#logoutBtn").addEventListener("click",signOut);
    $$("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>goPage(btn.dataset.nav)));
    $$("[data-go]").forEach(btn=>btn.addEventListener("click",()=>goPage(btn.dataset.go)));
    $("#quickAddBtn").addEventListener("click",()=>openTransactionModal());
    $("#addPocketBtn").addEventListener("click",openPocketModal);
    $$("[data-add-pocket]").forEach(btn=>btn.addEventListener("click",openPocketModal));
    $$("[data-open-form]").forEach(btn=>btn.addEventListener("click",()=>openTransactionModal()));
    $$("[data-close-modal]").forEach(btn=>btn.addEventListener("click",closeTransactionModal));
    $$("[data-close-pocket]").forEach(btn=>btn.addEventListener("click",()=>$("#pocketModal").classList.add("hidden")));
    $("#transactionModal").addEventListener("click",e=>{if(e.target===$("#transactionModal"))closeTransactionModal();});
    $("#pocketModal").addEventListener("click",e=>{if(e.target===$("#pocketModal"))$("#pocketModal").classList.add("hidden");});
    $("#confirmModal").addEventListener("click",e=>{if(e.target===$("#confirmModal"))closeConfirm();});
    $$("[data-type]").forEach(btn=>btn.addEventListener("click",()=>{selectedType=btn.dataset.type;updateTypeToggle();}));
    $("#amountInput").addEventListener("input",e=>{const digits=e.target.value.replace(/\D/g,"");e.target.value=digits?new Intl.NumberFormat("id-ID",{maximumFractionDigits:0}).format(Number(digits)):"";});
    $("#transactionForm").addEventListener("submit",submitTransaction);
    $("#pocketForm").addEventListener("submit",submitPocket);
    $$(".icon-choice").forEach(btn=>btn.addEventListener("click",()=>{chosenPocketIcon=btn.dataset.icon;$("#pocketIconInput").value=chosenPocketIcon;$$(".icon-choice").forEach(b=>b.classList.toggle("selected",b===btn));}));
    $("#searchTransactions").addEventListener("input",renderTransactions);$("#typeFilter").addEventListener("change",renderTransactions);$("#pocketFilter").addEventListener("change",renderTransactions);
    $("#clearHistoryBtn").addEventListener("click",clearHistory);
    $("#cancelConfirm").addEventListener("click",closeConfirm);
    $("#acceptConfirm").addEventListener("click",()=>{const action=confirmAction;closeConfirm();if(action)action();});
    document.addEventListener("click",e=>{
      const delTx=e.target.closest("[data-delete-transaction]");if(delTx){deleteTransaction(delTx.dataset.deleteTransaction);return;}
      const add=e.target.closest("[data-pocket-add]");if(add){openTransactionModal(add.dataset.pocketAdd);return;}
      const delPocket=e.target.closest("[data-delete-pocket]");if(delPocket){deletePocket(delPocket.dataset.deletePocket);}
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeTransactionModal();$("#pocketModal").classList.add("hidden");closeConfirm();}});
  }
  bindEvents();
  const savedSession = (()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY));}catch{return null;}})();
  if(savedSession?.username){showApp(savedSession.username,savedSession.mode||"local");}else{showAuth();}
})();
