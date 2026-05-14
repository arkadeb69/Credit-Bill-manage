import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  CreditCard, 
  Trash2, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Smartphone,
  Info,
  X
} from "lucide-react";

const PAYMENT_APPS = ["CRED", "Paytm", "PhonePe", "Bank App", "Other"];

const INITIAL_CARDS = [
  { id: 1, name: "SBI Credit Card", bank: "SBI", totalBill: 12500, dueDate: "2025-05-20" },
  { id: 2, name: "HDFC Regalia", bank: "HDFC", totalBill: 8750, dueDate: "2025-05-18" },
  { id: 3, name: "ICICI Coral", bank: "ICICI", totalBill: 5200, dueDate: "2025-05-25" },
  { id: 4, name: "Axis Flipkart", bank: "Axis", totalBill: 3600, dueDate: "2025-05-22" },
  { id: 5, name: "Kotak League", bank: "Kotak", totalBill: 9100, dueDate: "2025-05-19" },
];

const SAMPLE_PAYMENTS = [
  { id: 1, cardId: 2, amount: 8750, date: "2025-05-10", app: "CRED", notes: "Full payment done" },
  { id: 2, cardId: 3, amount: 3000, date: "2025-05-11", app: "PhonePe", notes: "Partial payment" },
];

// Helper functions (preserved from user request)
function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function formatINR(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.ceil((due - today) / 86400000);
}

function getCardStatus(card, payments) {
  const paid = payments.filter(p => p.cardId === card.id).reduce((s, p) => s + Number(p.amount), 0);
  if (paid <= 0) return "pending";
  if (paid >= card.totalBill) return "paid";
  return "partial";
}

function getCardPaid(card, payments) {
  return payments.filter(p => p.cardId === card.id).reduce((s, p) => s + Number(p.amount), 0);
}

export default function App() {
  const [cards, setCards] = useState(() => loadFromStorage("cc_cards", INITIAL_CARDS));
  const [payments, setPayments] = useState(() => loadFromStorage("cc_payments", SAMPLE_PAYMENTS));
  const [page, setPage] = useState("dashboard");
  const [form, setForm] = useState({ cardId: "", amount: "", app: "CRED", date: new Date().toISOString().slice(0,10), notes: "" });
  const [formError, setFormError] = useState("");
  const [dupWarning, setDupWarning] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const [addCardForm, setAddCardForm] = useState({ name: "", bank: "", totalBill: "", dueDate: "" });
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => { saveToStorage("cc_cards", cards); }, [cards]);
  useEffect(() => { saveToStorage("cc_payments", payments); }, [payments]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const pendingCards = cards.filter(c => {
    const s = getCardStatus(c, payments);
    return s === "pending" || s === "partial";
  });

  const upcomingCards = cards.filter(c => {
    const d = daysUntil(c.dueDate);
    return d >= 0 && d <= 2 && getCardStatus(c, payments) !== "paid";
  });

  function handleFormChange(field, val) {
    const updated = { ...form, [field]: val };
    setForm(updated);
    if (field === "cardId" && val) {
      const card = cards.find(c => c.id === Number(val));
      const alreadyPaid = card && getCardStatus(card, payments) === "paid";
      setDupWarning(alreadyPaid);
    }
  }

  function handleAddPayment() {
    setFormError("");
    if (!form.cardId) { setFormError("Please select a card."); return; }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setFormError("Please enter a valid amount."); return; }
    if (!form.date) { setFormError("Please enter a date."); return; }

    const newPayment = {
      id: Date.now(),
      cardId: Number(form.cardId),
      amount: Number(form.amount),
      date: form.date,
      app: form.app,
      notes: form.notes,
    };
    setPayments(prev => [...prev, newPayment]);
    setForm({ cardId: "", amount: "", app: "CRED", date: new Date().toISOString().slice(0,10), notes: "" });
    setDupWarning(false);
    showToast("Payment saved successfully!");
    setPage("dashboard");
  }

  function handleDeletePayment(id) {
    setDeleteConfirm({ type: "payment", id });
  }

  function confirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "payment") {
      setPayments(prev => prev.filter(p => p.id !== deleteConfirm.id));
      showToast("Payment record deleted.");
    } else if (deleteConfirm.type === "card") {
      setCards(prev => prev.filter(c => c.id !== deleteConfirm.id));
      setPayments(prev => prev.filter(p => p.cardId !== deleteConfirm.id));
      showToast("Card removed.");
    }
    setDeleteConfirm(null);
  }

  function handleAddCard() {
    if (!addCardForm.name || !addCardForm.totalBill || !addCardForm.dueDate) return;
    const newCard = {
      id: Date.now(),
      name: addCardForm.name,
      bank: addCardForm.bank || "Other",
      totalBill: Number(addCardForm.totalBill),
      dueDate: addCardForm.dueDate,
    };
    setCards(prev => [...prev, newCard]);
    setAddCardForm({ name: "", bank: "", totalBill: "", dueDate: "" });
    setShowAddCard(false);
    showToast("Card added!");
  }

  const navItems = [
    { key: "dashboard", label: "Home", icon: LayoutDashboard },
    { key: "add", label: "Pay", icon: PlusCircle },
    { key: "history", label: "History", icon: History },
    { key: "cards", label: "Cards", icon: CreditCard },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 pt-8">
      {/* Header */}
      <header className="mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Bill Tracker</span>
          <h1 className="text-3xl font-bold gradient-text">My Credit Bills</h1>
          <p className="text-sm text-text-muted">Manage your finances with elegance.</p>
        </motion.div>
      </header>

      {/* Reminder Banner */}
      <AnimatePresence>
        {(pendingCards.length > 0 || upcomingCards.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="glass-card p-4 border-warning/20 bg-warning/5">
              {pendingCards.length > 0 && (
                <div className="flex items-center gap-3 text-warning font-semibold mb-2">
                  <AlertCircle size={20} />
                  <span>{pendingCards.length} card{pendingCards.length > 1 ? "s" : ""} pending payment</span>
                </div>
              )}
              {upcomingCards.map(c => {
                const d = daysUntil(c.dueDate);
                return (
                  <div key={c.id} className="flex items-center gap-3 text-danger/80 text-sm pl-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                    <span><strong>{c.name}</strong> due {d === 0 ? "today!" : d === 1 ? "tomorrow!" : `in ${d} days`}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <AnimatePresence mode="wait">
          {/* DASHBOARD */}
          {page === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold mb-4">Cards Overview</h2>
              {cards.map(card => {
                const status = getCardStatus(card, payments);
                const paid = getCardPaid(card, payments);
                const remaining = Math.max(0, card.totalBill - paid);
                const progress = (paid / card.totalBill) * 100;
                const days = daysUntil(card.dueDate);
                const lastPay = payments.filter(p => p.cardId === card.id).sort((a,b) => b.date.localeCompare(a.date))[0];

                return (
                  <div key={card.id} className="glass-card overflow-hidden group">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <CreditCard className="text-primary" size={20} />
                            {card.name}
                          </h3>
                          <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                            <Calendar size={14} />
                            Due: {formatDate(card.dueDate)}
                            {days >= 0 && days <= 5 && status !== "paid" && (
                              <span className={`ml-2 font-bold ${days <= 1 ? "text-danger" : "text-warning"}`}>
                                ({days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          status === 'paid' ? 'bg-success/20 text-success' : 
                          status === 'partial' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                        }`}>
                          {status}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Total</p>
                          <p className="font-bold">{formatINR(card.totalBill)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Paid</p>
                          <p className="font-bold text-success">{formatINR(paid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Left</p>
                          <p className={`font-bold ${remaining > 0 ? "text-danger" : "text-success"}`}>{formatINR(remaining)}</p>
                        </div>
                      </div>

                      <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          className={`absolute top-0 left-0 h-full rounded-full ${
                            status === 'paid' ? 'bg-success' : 'bg-primary'
                          }`}
                        />
                      </div>

                      {lastPay && (
                        <div className="bg-white/5 rounded-xl p-3 text-xs text-text-muted flex items-center gap-3 mb-4">
                          <Info size={14} className="text-primary" />
                          <span>Last: {formatINR(lastPay.amount)} via {lastPay.app} on {formatDate(lastPay.date)}</span>
                        </div>
                      )}

                      <button 
                        onClick={() => { setForm(f => ({...f, cardId: String(card.id)})); setPage("add"); }}
                        className="w-100 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/5"
                        style={{ width: '100%' }}
                      >
                        <PlusCircle size={18} />
                        Add Payment
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ADD PAYMENT */}
          {page === "add" && (
            <motion.div 
              key="add"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold">Record Payment</h2>

              <div className="glass-card p-6 space-y-6">
                {dupWarning && (
                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex gap-3 text-warning text-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <p><strong>Heads up!</strong> This card is already fully paid. Double-check before proceeding.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-muted">Select Card</label>
                  <select 
                    value={form.cardId} 
                    onChange={e => handleFormChange("cardId", e.target.value)}
                    className="w-full"
                  >
                    <option value="">Choose a card</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-muted">Amount Paid</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="number" 
                      value={form.amount} 
                      onChange={e => handleFormChange("amount", e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 text-xl font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-muted">Payment App</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_APPS.map(app => (
                      <button 
                        key={app} 
                        onClick={() => handleFormChange("app", app)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                          form.app === app ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted">Date</label>
                    <input 
                      type="date" 
                      value={form.date} 
                      onChange={e => handleFormChange("date", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-muted">Notes (Optional)</label>
                    <input 
                      type="text" 
                      value={form.notes} 
                      onChange={e => handleFormChange("notes", e.target.value)}
                      placeholder="Full payment, etc."
                      className="w-full"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="text-danger text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={handleAddPayment} className="btn-primary flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} />
                    Save Payment
                  </button>
                  <button 
                    onClick={() => setPage("dashboard")}
                    className="p-3 text-text-muted font-bold hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* HISTORY */}
          {page === "history" && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold mb-4">Payment History</h2>
              {payments.length === 0 ? (
                <div className="glass-card p-12 text-center text-text-muted">
                  <History size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No transactions found.</p>
                </div>
              ) : (
                [...payments].sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                  const card = cards.find(c => c.id === p.cardId);
                  return (
                    <motion.div 
                      layout
                      key={p.id} 
                      className="glass-card p-5 flex justify-between items-center group"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <IndianRupee size={24} />
                        </div>
                        <div>
                          <p className="font-bold">{card?.name || "Deleted Card"}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                            <Calendar size={12} />
                            <span>{formatDate(p.date)}</span>
                            <span className="opacity-30">•</span>
                            <Smartphone size={12} />
                            <span>{p.app}</span>
                          </div>
                          {p.notes && <p className="text-xs text-text-muted mt-1 italic opacity-60">"{p.notes}"</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-success">{formatINR(p.amount)}</p>
                        <button 
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* MY CARDS */}
          {page === "cards" && (
            <motion.div 
              key="cards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Manage Cards</h2>
                <button 
                  onClick={() => setShowAddCard(!showAddCard)}
                  className="p-2 bg-primary/10 text-primary rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-primary/20 transition-all"
                >
                  <PlusCircle size={18} />
                  New Card
                </button>
              </div>

              <AnimatePresence>
                {showAddCard && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-6 border-primary/20 mb-6"
                  >
                    <h3 className="font-bold mb-4">Add New Card</h3>
                    <div className="space-y-4">
                      <input 
                        placeholder="Card Name (e.g. HDFC Swiggy)" 
                        value={addCardForm.name} 
                        onChange={e => setAddCardForm(f=>({...f, name: e.target.value}))}
                        className="w-full"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Bank Name" 
                          value={addCardForm.bank} 
                          onChange={e => setAddCardForm(f=>({...f, bank: e.target.value}))}
                          className="w-full"
                        />
                        <input 
                          type="number" 
                          placeholder="Total Bill Amount" 
                          value={addCardForm.totalBill} 
                          onChange={e => setAddCardForm(f=>({...f, totalBill: e.target.value}))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted ml-1">Due Date</label>
                        <input 
                          type="date" 
                          value={addCardForm.dueDate} 
                          onChange={e => setAddCardForm(f=>({...f, dueDate: e.target.value}))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={handleAddCard}
                          className="btn-primary flex-1"
                        >
                          Add Card
                        </button>
                        <button 
                          onClick={() => setShowAddCard(false)}
                          className="px-6 font-bold text-text-muted hover:text-text transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {cards.map(card => {
                const status = getCardStatus(card, payments);
                const paid = getCardPaid(card, payments);
                return (
                  <div key={card.id} className="glass-card p-5 group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                          <CreditCard size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{card.name}</p>
                          <p className="text-xs text-text-muted">{card.bank} • Due {formatDate(card.dueDate)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-bold">Bill: {formatINR(card.totalBill)}</span>
                            <span className="text-xs font-bold text-success">Paid: {formatINR(paid)}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setDeleteConfirm({ type: "card", id: card.id })}
                        className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg nav-blur rounded-3xl p-2 z-50 flex shadow-2xl">
        {navItems.map(item => (
          <button 
            key={item.key} 
            onClick={() => setPage(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all relative ${
              page === item.key ? 'text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            <item.icon size={20} strokeWidth={page === item.key ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            {page === item.key && (
              <motion.div 
                layoutId="nav-pill"
                className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-sm w-full p-8 text-center"
            >
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
              <p className="text-text-muted text-sm mb-8">
                {deleteConfirm.type === "payment" 
                  ? "This transaction record will be permanently removed." 
                  : "This card and all associated history will be deleted."}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="p-4 bg-danger text-white rounded-2xl font-bold hover:bg-danger/90 transition-all"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="p-4 text-text-muted font-bold hover:text-text transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="bg-success text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-3">
              <CheckCircle2 size={18} />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
