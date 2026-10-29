/**
 * ALL SERVICE BD - 24/7 Standalone Telegram Bot Engine
 * Complete Self-Contained Bot with Zero Dependencies (Pure Node.js 18+)
 * 
 * Ready to deploy on Render.com, Railway.app, Koyeb, Replit, VPS, or PC.
 * Runs 24/7/365 without sleep!
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const BOT_TOKEN = process.env.BOT_TOKEN || '8790920448:AAGnxbEufr8lBXVrVt4IYNg9Yk-PJIXTOAs';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'komol127';
const ADMIN_CHAT_ID = 7983767470;
const BKASH_NUMBER = process.env.BKASH_NUMBER || '01608150364';
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.resolve(process.cwd(), 'bot_database.json');

// --- DATABASE SERVICE ---
let db = {
  adminUsername: ADMIN_USERNAME,
  adminChatId: ADMIN_CHAT_ID,
  bkashNumber: BKASH_NUMBER,
  botToken: BOT_TOKEN,
  liveNotice: '🔥 BM ও Facebook New ID ফ্রেশ স্টক রিলোড হয়েছে! এখনই ব্যালেন্স রিচার্জ করে কিনুন।',
  products: {
    bm: { id: 'bm', nameBn: '🏢 ফেসবুক BM (Business Manager)', price: 5, stock: [] },
    new_id: { id: 'new_id', nameBn: '🆔 নতুন ফেসবুক আইডি (New ID)', price: 6, stock: [] },
    pc_clone_1000: { id: 'pc_clone_1000', nameBn: '💻 ১. PC Clone ID (1000 Series)', price: 12, stock: [] },
    pc_clone_61: { id: 'pc_clone_61', nameBn: '💻 ২. PC Clone ID (61 Series)', price: 12, stock: [] },
    nord_vpn: { id: 'nord_vpn', nameBn: '🔵 ১. NordVPN Premium', price: 45, stock: [] },
    express_vpn: { id: 'express_vpn', nameBn: '🔴 ২. ExpressVPN Premium', price: 60, stock: [] }
  },
  users: {},
  deposits: [],
  orders: [],
  pollingOffset: 0
};

// Load existing database if available
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = { ...db, ...parsed, products: { ...db.products, ...(parsed.products || {}) } };
    console.log('📦 Database loaded successfully.');
  }
} catch (e) {
  console.error('Error loading database:', e.message);
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db:', e.message);
  }
}

function getUser(chatId) {
  return db.users[String(chatId)];
}

function getOrCreateUser(chatId, firstName, username) {
  const key = String(chatId);
  if (!db.users[key]) {
    db.users[key] = {
      chatId,
      firstName: firstName || 'User',
      username: username || '',
      balance: 0,
      joinedAt: new Date().toISOString()
    };
    saveDb();
  } else if (username && db.users[key].username !== username) {
    db.users[key].username = username;
    saveDb();
  }
  return db.users[key];
}

function isMasterAdmin(chatId, username) {
  const isId = Number(chatId) === ADMIN_CHAT_ID;
  const isUser = Boolean(username && username.toLowerCase().replace('@', '') === ADMIN_USERNAME.toLowerCase());
  return isId || isUser;
}

// --- TELEGRAM API CALLER WITH BOT MECHANIC AUTO-RETRY ---
async function callApi(method, payload, attempt = 1) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    return await res.json();
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 150));
      return callApi(method, payload, attempt + 1);
    }
    return { ok: false, error: err.message };
  }
}

async function sendMessage(chatId, text, replyMarkup = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return callApi('sendMessage', payload);
}

// --- MAIN MENU & UI HELPERS ---
async function sendMainMenu(chatId, user) {
  const p = db.products;
  const notice = db.liveNotice ? `\n\n📢 <b>আপডেট নোটিশ:</b>\n<i>${db.liveNotice}</i>` : '';

  const text = `👋 <b>স্বাগতম ${user.firstName}!</b>

🛒 <b>ALL SERVICE BD - অফিসিয়াল অটোমেটেড শপ</b>
আমরা ১০০% রিয়েল ও ট্রাস্টেড ফেসবুক একাউন্ট, BM এবং ভিপিএন সেবা প্রদান করি।

💰 <b>আপনার ব্যালেন্স:</b> <b>৳ ${user.balance}</b>

📦 <b>উপলব্ধ পণ্য ও মূল্যতালিকা:</b>
• 🏢 BM (Business Manager): <b>৳ ${p.bm?.price || 5}</b> (স্টক: ${p.bm?.stock?.length || 0})
• 🆔 New ID: <b>৳ ${p.new_id?.price || 6}</b> (স্টক: ${p.new_id?.stock?.length || 0})
• 💻 PC Clone (1000 Series): <b>৳ ${p.pc_clone_1000?.price || 12}</b> (স্টক: ${p.pc_clone_1000?.stock?.length || 0})
• 💻 PC Clone (61 Series): <b>৳ ${p.pc_clone_61?.price || 12}</b> (স্টক: ${p.pc_clone_61?.stock?.length || 0})
• 🔵 NordVPN: <b>৳ ${p.nord_vpn?.price || 45}</b> (স্টক: ${p.nord_vpn?.stock?.length || 0})
• 🔴 ExpressVPN: <b>৳ ${p.express_vpn?.price || 60}</b> (স্টক: ${p.express_vpn?.stock?.length || 0})
${notice}

👇 <b>নিচের বাটন চেপে পণ্য নির্বাচন অথবা ব্যালেন্স রিচার্জ করুন:</b>`;

  const inlineKeyboard = [
    [
      { text: `🏢 BM (৳${p.bm?.price || 5})`, callback_data: 'view_prod:bm' },
      { text: `🆔 New ID (৳${p.new_id?.price || 6})`, callback_data: 'view_prod:new_id' }
    ],
    [
      { text: '💻 PC Clone IDs 🔽', callback_data: 'pc_clone_menu' },
      { text: '🛡️ Premium VPNs 🔽', callback_data: 'vpn_menu' }
    ],
    [
      { text: '💳 ব্যালেন্স অ্যাড (bKash)', callback_data: 'add_balance' },
      { text: '👤 আমার প্রোফাইল', callback_data: 'my_profile' }
    ],
    [
      { text: '📦 আমার অর্ডারসমূহ', callback_data: 'my_orders' },
      { text: '👨‍💻 এডমিন সাপোর্ট', callback_data: 'support' }
    ]
  ];

  if (isMasterAdmin(chatId, user.username)) {
    inlineKeyboard.push([{ text: '⚙️ এডমিন কন্ট্রোল প্যানেল', callback_data: 'admin_menu' }]);
  }

  await sendMessage(chatId, text, { inline_keyboard: inlineKeyboard });
}

// User state tracker for forms
const userStates = {};

// --- MESSAGE HANDLER ---
async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  if (!chatId) return;

  const firstName = msg.from?.first_name || 'User';
  const username = msg.from?.username || '';
  const text = (msg.text || '').trim();

  const user = getOrCreateUser(chatId, firstName, username);
  const isAdmin = isMasterAdmin(chatId, username);

  if (text === '/cancel') {
    delete userStates[chatId];
    await sendMessage(chatId, '❌ প্রক্রিয়া বাতিল করা হয়েছে।');
    return sendMainMenu(chatId, user);
  }

  // Admin Stock Upload
  if (isAdmin && userStates[chatId]?.step === 'awaiting_stock_upload') {
    const pid = userStates[chatId].productId;
    delete userStates[chatId];
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return sendMessage(chatId, '⚠️ স্টক তথ্য পাওয়া যায়নি।');
    if (!db.products[pid].stock) db.products[pid].stock = [];
    db.products[pid].stock.push(...lines);
    saveDb();
    return sendMessage(chatId, `🎉 <b>সফলভাবে ${lines.length} টি স্টক যোগ হয়েছে!</b>\nবর্তমান মোট স্টক: ${db.products[pid].stock.length} টি।`);
  }

  // Admin Price Update
  if (isAdmin && userStates[chatId]?.step === 'awaiting_price_change') {
    const pid = userStates[chatId].productId;
    delete userStates[chatId];
    const newPrice = parseFloat(text);
    if (isNaN(newPrice) || newPrice < 0) return sendMessage(chatId, '⚠️ সঠিক টাকার সংখ্যা দিন।');
    db.products[pid].price = newPrice;
    saveDb();
    return sendMessage(chatId, `✅ <b>মূল্য পরিবর্তিত হয়েছে!</b>\n${db.products[pid].nameBn} = ৳${newPrice}`);
  }

  // TrxID Deposit Input
  if (userStates[chatId]?.step === 'awaiting_deposit_trx' || (/^[A-Za-z0-9]{8,14}$/.test(text) && !text.startsWith('/'))) {
    const trxId = text.toUpperCase();
    const amount = userStates[chatId]?.amount || 100;
    delete userStates[chatId];

    const dep = {
      id: 'DEP_' + Date.now(),
      chatId,
      username: user.username,
      amount,
      trxId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.deposits.push(dep);
    saveDb();

    await sendMessage(chatId, `✅ <b>পেমেন্ট রিকোয়েস্ট জমা হয়েছে!</b>\n\nপরিমাণ: <b>৳${amount}</b>\nTrxID: <code>${trxId}</code>\n\nএডমিন ভেরিফাই করে দ্রুত আপনার ব্যালেন্সে টাকা যুক্ত করবেন।`);
    await sendMessage(ADMIN_CHAT_ID, `🔔 <b>নতুন বিকাশ ডিপোজিট এসেছে!</b>\n\nইউজার: @${user.username} [ID: ${chatId}]\nপরিমাণ: <b>৳${amount}</b>\nTrxID: <code>${trxId}</code>`, {
      inline_keyboard: [
        [
          { text: `✅ Approve ৳${amount}`, callback_data: `admin_appr:${dep.id}` },
          { text: '❌ Reject', callback_data: `admin_rej:${dep.id}` }
        ]
      ]
    });
    return;
  }

  // Greetings & Menu triggers
  const lower = text.toLowerCase();
  if (text.startsWith('/start') || lower === 'start' || lower === 'menu' || lower === 'hi' || lower === 'hello' || text === 'মেনু') {
    return sendMainMenu(chatId, user);
  }

  // Admin shortcut
  if (text === '/admin') {
    if (isAdmin) {
      return sendMessage(chatId, '⚙️ <b>এডমিন মেনু:</b>', {
        inline_keyboard: [
          [{ text: '📊 স্টক রিপোর্ট', callback_data: 'admin_view_stock' }],
          [{ text: '💰 মূল্য পরিবর্তন', callback_data: 'admin_price_menu' }],
          [{ text: '🧾 পেন্ডিং ডিপোজিট', callback_data: 'admin_pending_deposits' }],
          [{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]
        ]
      });
    } else {
      return sendMessage(chatId, '⛔ আপনি এই বটের এডমিন নন।');
    }
  }

  // Fallback with Quick Menu
  const p = db.products;
  await sendMessage(
    chatId,
    `🤖 আপনি লিখেছেন: "<i>${text}</i>"\n\nআমাদের সেবা ও পণ্য তালিকা দেখতে নিচের বাটনগুলো ব্যবহার করুন:`,
    {
      inline_keyboard: [
        [
          { text: `🏢 BM (৳${p.bm?.price || 5})`, callback_data: 'view_prod:bm' },
          { text: `🆔 New ID (৳${p.new_id?.price || 6})`, callback_data: 'view_prod:new_id' }
        ],
        [
          { text: '💻 PC Clone IDs 🔽', callback_data: 'pc_clone_menu' },
          { text: '🛡️ Premium VPNs 🔽', callback_data: 'vpn_menu' }
        ],
        [
          { text: '💳 ব্যালেন্স রিচার্জ (bKash)', callback_data: 'add_balance' },
          { text: '👤 আমার প্রোফাইল', callback_data: 'my_profile' }
        ]
      ]
    }
  );
}

// --- CALLBACK QUERY HANDLER ---
async function handleCallback(query) {
  const chatId = query.message?.chat?.id;
  const data = query.data || '';
  if (!chatId) return;

  // Acknowledge click instantly
  callApi('answerCallbackQuery', { callback_query_id: query.id }).catch(() => {});

  const user = getOrCreateUser(chatId, query.from?.first_name, query.from?.username);
  const isAdmin = isMasterAdmin(chatId, query.from?.username);

  if (data === 'main_menu') return sendMainMenu(chatId, user);

  if (data === 'pc_clone_menu') {
    const p = db.products;
    return sendMessage(chatId, '💻 <b>PC Clone আইডি সিরিজ নির্বাচন করুন:</b>', {
      inline_keyboard: [
        [{ text: `💻 ১. 1000 Series (৳${p.pc_clone_1000?.price || 12})`, callback_data: 'view_prod:pc_clone_1000' }],
        [{ text: `💻 ২. 61 Series (৳${p.pc_clone_61?.price || 12})`, callback_data: 'view_prod:pc_clone_61' }],
        [{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data === 'vpn_menu') {
    const p = db.products;
    return sendMessage(chatId, '🛡️ <b>প্রিমিয়াম ভিপিএন নির্বাচন করুন:</b>', {
      inline_keyboard: [
        [{ text: `🔵 ১. NordVPN (৳${p.nord_vpn?.price || 45})`, callback_data: 'view_prod:nord_vpn' }],
        [{ text: `🔴 ২. ExpressVPN (৳${p.express_vpn?.price || 60})`, callback_data: 'view_prod:express_vpn' }],
        [{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data.startsWith('view_prod:')) {
    const pid = data.replace('view_prod:', '');
    const prod = db.products[pid];
    if (!prod) return sendMessage(chatId, '⚠️ পণ্যটি পাওয়া যায়নি।');
    const stockCount = prod.stock?.length || 0;

    return sendMessage(chatId, `🛍️ <b>${prod.nameBn}</b>\n\n💵 মূল্য: <b>৳${prod.price}</b>\n📦 স্টক: <b>${stockCount} টি</b>\n💰 আপনার ব্যালেন্স: <b>৳${user.balance}</b>\n\nকিনতে নিচের বাটন চাপুন:`, {
      inline_keyboard: [
        [{ text: `🛒 এখনই কিনুন (৳${prod.price})`, callback_data: `buy_prod:${pid}` }],
        [{ text: '🔙 মেনুতে ফিরে যান', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data.startsWith('buy_prod:')) {
    const pid = data.replace('buy_prod:', '');
    const prod = db.products[pid];
    if (!prod || !prod.stock || prod.stock.length === 0) {
      return sendMessage(chatId, '❌ <b>দুঃখিত! এই পণ্যের স্টক শেষ হয়ে গেছে।</b>\nএডমিন দ্রুত নতুন স্টক লোড করবেন।');
    }
    if (user.balance < prod.price) {
      return sendMessage(chatId, `⚠️ <b>অপর্যাপ্ত ব্যালেন্স!</b>\n\nপণ্যের মূল্য: ৳${prod.price}\nআপনার ব্যালেন্স: ৳${user.balance}\n\nঅনুগ্রহ করে প্রথমে ব্যালেন্স রিচার্জ করুন।`, {
        inline_keyboard: [
          [{ text: '💳 ব্যালেন্স অ্যাড করুন', callback_data: 'add_balance' }],
          [{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]
        ]
      });
    }

    // Purchase successful
    const item = prod.stock.shift();
    user.balance -= prod.price;
    const order = {
      orderId: 'ORD_' + Date.now(),
      chatId,
      username: user.username,
      productId: pid,
      price: prod.price,
      itemData: item,
      date: new Date().toISOString()
    };
    db.orders.push(order);
    saveDb();

    return sendMessage(chatId, `🎉 <b>ক্রয় সফল হয়েছে!</b>\n\n📦 <b>পণ্য:</b> ${prod.nameBn}\n💵 <b>কাটা হয়েছে:</b> ৳${prod.price}\n💰 <b>অবশিষ্ট ব্যালেন্স:</b> ৳${user.balance}\n\n📝 <b>আপনার তথ্য/ক্রেডেনশিয়াল:</b>\n<code>${item}</code>\n\nধন্যবাদ আমাদের সাথে থাকার জন্য!`, {
      inline_keyboard: [[{ text: '🛍️ আরও কেনাকাটা করুন', callback_data: 'main_menu' }]]
    });
  }

  if (data === 'add_balance') {
    return sendMessage(chatId, `💳 <b>বিকাশ ব্যালেন্স রিচার্জের নিয়ম:</b>\n\n১. নিচে দেওয়া বিকাশ পার্সোনাল নম্বরে Send Money করুন:\n👉 <b>${db.bkashNumber}</b> (bKash Personal)\n\n২. টাকা পাঠানোর পর পাওয়া <b>TrxID (Transaction ID)</b> এই চ্যাটে লিখে মেসেজ পাঠান।\n\nএডমিন দ্রুত চেক করে ব্যালেন্সে টাকা যুক্ত করে দেবেন।`, {
      inline_keyboard: [[{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]]
    });
  }

  if (data === 'my_profile') {
    const userOrders = db.orders.filter((o) => o.chatId === chatId);
    return sendMessage(chatId, `👤 <b>ইউজার প্রোফাইল:</b>\n\nনাম: <b>${user.firstName}</b>\nইউজারনেম: @${user.username || 'নেই'}\nআইডি: <code>${chatId}</code>\n💰 বর্তমান ব্যালেন্স: <b>৳${user.balance}</b>\n🛍️ মোট অর্ডার: <b>${userOrders.length} টি</b>`, {
      inline_keyboard: [
        [{ text: '💳 ব্যালেন্স রিচার্জ', callback_data: 'add_balance' }],
        [{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data === 'support') {
    return sendMessage(chatId, `👨‍💻 <b>এডমিন সাপোর্ট:</b>\n\nযেকোনো প্রশ্ন বা সমস্যায় সরাসরি মেসেজ দিন:\n👉 @${db.adminUsername}\nবিকাশ নম্বর: <b>${db.bkashNumber}</b>`, {
      inline_keyboard: [[{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]]
    });
  }

  // Admin handlers
  if (data === 'admin_menu' && isAdmin) {
    return sendMessage(chatId, '⚙️ <b>এডমিন কন্ট্রোল প্যানেল:</b>', {
      inline_keyboard: [
        [{ text: '📥 স্টক লোড করুন', callback_data: 'admin_upload_select' }],
        [{ text: '💰 মূল্য পরিবর্তন করুন', callback_data: 'admin_price_menu' }],
        [{ text: '🧾 পেন্ডিং ডিপোজিট', callback_data: 'admin_pending_deposits' }],
        [{ text: '🔙 প্রধান মেনু', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data === 'admin_upload_select' && isAdmin) {
    return sendMessage(chatId, '📥 <b>কোন পণ্যের স্টক লোড করতে চান?</b>', {
      inline_keyboard: [
        [{ text: '🏢 BM স্টক লোড', callback_data: 'admin_upload_prompt:bm' }],
        [{ text: '🆔 New ID স্টক লোড', callback_data: 'admin_upload_prompt:new_id' }],
        [{ text: '💻 1000 Series স্টক লোড', callback_data: 'admin_upload_prompt:pc_clone_1000' }],
        [{ text: '💻 61 Series স্টক লোড', callback_data: 'admin_upload_prompt:pc_clone_61' }],
        [{ text: '🔵 NordVPN স্টক লোড', callback_data: 'admin_upload_prompt:nord_vpn' }],
        [{ text: '🔴 ExpressVPN স্টক লোড', callback_data: 'admin_upload_prompt:express_vpn' }],
        [{ text: '🔙 এডমিন মেনু', callback_data: 'admin_menu' }]
      ]
    });
  }

  if (data.startsWith('admin_upload_prompt:') && isAdmin) {
    const pid = data.replace('admin_upload_prompt:', '');
    userStates[chatId] = { step: 'awaiting_stock_upload', productId: pid };
    return sendMessage(chatId, `📥 <b>${db.products[pid]?.nameBn} স্টক লোড মোড:</b>\n\nএই চ্যাটে একাউন্ট ডাটাগুলো মেসেজ আকারে পেস্ট করে পাঠান (প্রতি লাইনে ১টি)।\nবাতিল করতে <code>/cancel</code> লিখুন।`);
  }

  if (data.startsWith('admin_appr:') && isAdmin) {
    const depId = data.replace('admin_appr:', '');
    const dep = db.deposits.find((d) => d.id === depId);
    if (!dep || dep.status !== 'pending') return sendMessage(chatId, '⚠️ ডিপোজিটটি ইতিমধ্যে সম্পন্ন বা বাতিল হয়েছে।');
    dep.status = 'approved';
    const u = db.users[String(dep.chatId)];
    if (u) u.balance = (u.balance || 0) + dep.amount;
    saveDb();
    await sendMessage(chatId, `✅ <b>ডিপোজিট অনুমোদিত!</b> ৳${dep.amount} ব্যালেন্সে যোগ করা হয়েছে।`);
    await sendMessage(dep.chatId, `🎉 <b>আপনার বিকাশ ডিপোজিট সফল হয়েছে!</b>\n\nযোগ হয়েছে: <b>৳${dep.amount}</b>\nবর্তমান ব্যালেন্স: <b>৳${u?.balance || dep.amount}</b>\n\nএখনই কেনাকাটা করতে /start চাপুন!`);
    return;
  }
}

// --- AUTONOMOUS BOT MECHANIC & LONG-POLLING LOOP ---
let isPolling = false;
let offset = db.pollingOffset || 0;

async function startPolling() {
  if (isPolling) return;
  isPolling = true;
  console.log(`🚀 [Standalone Bot] 24/7 Engine Started for @BMBuySellPRO2026Bot...`);

  while (true) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=12`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          db.pollingOffset = offset;
          saveDb();

          // 🔧 BOT MECHANIC: Supervise every update with a 2-second deadline
          const updateChatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
          const mechanicTimer = setTimeout(async () => {
            if (updateChatId) {
              console.warn(`🔧 [Bot Mechanic] Auto-healed slow interaction for Chat ${updateChatId}`);
              const u = getUser(updateChatId) || getOrCreateUser(updateChatId, 'User');
              await sendMessage(updateChatId, '🛠️ <b>[স্বয়ংক্রিয় মেকানিক]</b> মেনু রিফ্রেশ করা হয়েছে:');
              await sendMainMenu(updateChatId, u);
            }
          }, 2000);

          try {
            if (update.message) await handleMessage(update.message);
            else if (update.callback_query) await handleCallback(update.callback_query);
          } catch (e) {
            console.error('Update processing error:', e.message);
          } finally {
            clearTimeout(mechanicTimer);
          }
        }
      }
    } catch (err) {
      // 🔧 MECHANIC AUTO-REPAIR ON CONNECTION DROP
      console.warn('⚡ [Mechanic] Reconnecting fresh socket in 500ms...');
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

// --- LIGHTWEIGHT HTTP HEALTH SERVER (FOR 24/7 CLOUD HOSTING) ---
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    bot: '@BMBuySellPRO2026Bot',
    uptime: Math.floor(process.uptime()),
    mechanic: 'Autonomous Self-Healing Active',
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 24/7 Cloud Web Service running on port ${PORT}`);
  startPolling();
});
