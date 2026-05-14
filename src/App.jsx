import { useState, useEffect } from "react";

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

const STATUS_STYLES = {
  paid:    { bg: "#e8f8f0", border: "#27ae60", text: "#155724", label: "✓ Paid", dot: "#27ae60" },
  pending: { bg: "#fff0f0", border: "#e53935", text: "#7f0000", label: "⚠ Pending", dot: "#e53935" },
  partial: { bg: "#fffbe6", border: "#f9a825", text: "#5f3c00", label: "◑ Partial", dot: "#f9a825" },
};

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
      const alreadyPaid = payments.some(p => p.cardId === Number(val) && getCardStatus(cards.find(c=>c.id===Number(val)), payments) === "paid");
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
    { key: "dashboard", label: "🏠 Home" },
    { key: "add", label: "➕ Add Payment" },
    { key: "history", label: "📋 History" },
    { key: "cards", label: "💳 My Cards" },
  ];

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#f5f0e8", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#2c5f8a", padding: "20px 24px 16px", color: "white" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>Bill Tracker</div>
        <div style={{ fontSize: 26, fontWeight: "bold" }}>My Credit Card Bills</div>
        <div style={{ fontSize: 14, opacity: 0.75, marginTop: 2 }}>Simple. Clear. Reliable.</div>
      </div>

      {/* Reminder Banner */}
      {(pendingCards.length > 0 || upcomingCards.length > 0) && (
        <div style={{ background: "#fff3cd", borderBottom: "2px solid #f9a825", padding: "12px 20px" }}>
          {pendingCards.length > 0 && (
            <div style={{ fontSize: 17, color: "#5f3c00", fontWeight: "bold", marginBottom: upcomingCards.length > 0 ? 6 : 0 }}>
              ⚠️ {pendingCards.length} card{pendingCards.length > 1 ? "s" : ""} still need payment
            </div>
          )}
          {upcomingCards.map(c => {
            const d = daysUntil(c.dueDate);
            return (
              <div key={c.id} style={{ fontSize: 15, color: "#7f0000" }}>
                🔔 <strong>{c.name}</strong> due {d === 0 ? "TODAY!" : d === 1 ? "tomorrow!" : `in ${d} days`}
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "#2c3e50", marginBottom: 16 }}>All Cards Overview</div>
            {cards.map(card => {
              const status = getCardStatus(card, payments);
              const paid = getCardPaid(card, payments);
              const remaining = Math.max(0, card.totalBill - paid);
              const s = STATUS_STYLES[status];
              const lastPay = payments.filter(p => p.cardId === card.id).sort((a,b) => b.date.localeCompare(a.date))[0];
              const days = daysUntil(card.dueDate);

              return (
                <div key={card.id} style={{
                  background: "white",
                  borderRadius: 16,
                  border: `2px solid ${s.border}`,
                  marginBottom: 16,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                  <div style={{ background: s.bg, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a2a3a" }}>💳 {card.name}</div>
                      <div style={{ fontSize: 14, color: "#555", marginTop: 2 }}>Due: {formatDate(card.dueDate)}
                        {days >= 0 && days <= 5 && status !== "paid" && (
                          <span style={{ marginLeft: 8, color: days <= 1 ? "#e53935" : "#f9a825", fontWeight: "bold" }}>
                            ({days === 0 ? "Today!" : days === 1 ? "Tomorrow!" : `${days} days`})
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ background: s.border, color: "white", borderRadius: 20, padding: "6px 16px", fontSize: 15, fontWeight: "bold" }}>
                      {s.label}
                    </div>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 3 }}>Total Bill</div>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: "#2c3e50" }}>{formatINR(card.totalBill)}</div>
                      </div>
                      <div style={{ textAlign: "center", borderLeft: "1px solid #eee", borderRight: "1px solid #eee" }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 3 }}>Paid</div>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: "#27ae60" }}>{formatINR(paid)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 3 }}>Remaining</div>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: remaining > 0 ? "#e53935" : "#27ae60" }}>{formatINR(remaining)}</div>
                      </div>
                    </div>
                    {lastPay && (
                      <div style={{ background: "#f0f8ff", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#2c5f8a" }}>
                        Last payment: {formatINR(lastPay.amount)} via {lastPay.app} on {formatDate(lastPay.date)}
                      </div>
                    )}
                    <button onClick={() => { setForm(f => ({...f, cardId: String(card.id)})); setPage("add"); }}
                      style={{ marginTop: 12, width: "100%", padding: "12px", background: "#2c5f8a", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>
                      + Add Payment for this Card
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ADD PAYMENT */}
        {page === "add" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "#2c3e50", marginBottom: 20 }}>Add a Payment</div>

            {dupWarning && (
              <div style={{ background: "#fff3cd", border: "2px solid #f9a825", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, color: "#5f3c00" }}>
                ⚠️ <strong>This card may already be paid.</strong><br />Please check before paying again.
              </div>
            )}

            <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <label style={{ display: "block", fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginBottom: 6 }}>Select Credit Card</label>
              <select value={form.cardId} onChange={e => handleFormChange("cardId", e.target.value)}
                style={{ width: "100%", padding: "14px 12px", fontSize: 17, borderRadius: 10, border: "2px solid #ccc", marginBottom: 18, background: "white" }}>
                <option value="">-- Choose a card --</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label style={{ display: "block", fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginBottom: 6 }}>Amount Paid (₹)</label>
              <input type="number" value={form.amount} onChange={e => handleFormChange("amount", e.target.value)}
                placeholder="Enter amount"
                style={{ width: "100%", padding: "14px 12px", fontSize: 19, borderRadius: 10, border: "2px solid #ccc", marginBottom: 18, boxSizing: "border-box" }} />

              <label style={{ display: "block", fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginBottom: 6 }}>Payment App Used</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                {PAYMENT_APPS.map(app => (
                  <button key={app} onClick={() => handleFormChange("app", app)}
                    style={{ padding: "10px 18px", fontSize: 16, borderRadius: 24, border: `2px solid ${form.app === app ? "#2c5f8a" : "#ccc"}`,
                      background: form.app === app ? "#2c5f8a" : "white", color: form.app === app ? "white" : "#444", cursor: "pointer", fontWeight: form.app === app ? "bold" : "normal" }}>
                    {app}
                  </button>
                ))}
              </div>

              <label style={{ display: "block", fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginBottom: 6 }}>Payment Date</label>
              <input type="date" value={form.date} onChange={e => handleFormChange("date", e.target.value)}
                style={{ width: "100%", padding: "14px 12px", fontSize: 17, borderRadius: 10, border: "2px solid #ccc", marginBottom: 18, boxSizing: "border-box" }} />

              <label style={{ display: "block", fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginBottom: 6 }}>Notes (optional)</label>
              <input type="text" value={form.notes} onChange={e => handleFormChange("notes", e.target.value)}
                placeholder="e.g. Full payment, EMI, etc."
                style={{ width: "100%", padding: "14px 12px", fontSize: 16, borderRadius: 10, border: "2px solid #ccc", marginBottom: 18, boxSizing: "border-box" }} />

              {formError && <div style={{ color: "#e53935", fontSize: 16, marginBottom: 12, fontWeight: "bold" }}>⚠ {formError}</div>}

              <button onClick={handleAddPayment}
                style={{ width: "100%", padding: 16, background: "#27ae60", color: "white", border: "none", borderRadius: 12, fontSize: 20, fontWeight: "bold", cursor: "pointer", marginBottom: 10 }}>
                ✓ Save Payment
              </button>
              <button onClick={() => setPage("dashboard")}
                style={{ width: "100%", padding: 14, background: "#f5f0e8", color: "#555", border: "2px solid #ccc", borderRadius: 12, fontSize: 16, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {page === "history" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "#2c3e50", marginBottom: 16 }}>Payment History</div>
            {payments.length === 0 ? (
              <div style={{ textAlign: "center", color: "#888", fontSize: 18, marginTop: 40 }}>No payments recorded yet.</div>
            ) : (
              [...payments].sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                const card = cards.find(c => c.id === p.cardId);
                return (
                  <div key={p.id} style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: "0 2px 6px rgba(0,0,0,0.06)", borderLeft: "5px solid #2c5f8a" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: "#1a2a3a" }}>💳 {card ? card.name : "Unknown Card"}</div>
                        <div style={{ fontSize: 22, fontWeight: "bold", color: "#27ae60", marginTop: 4 }}>{formatINR(p.amount)}</div>
                        <div style={{ fontSize: 15, color: "#555", marginTop: 4 }}>📅 {formatDate(p.date)} &nbsp;|&nbsp; 📱 {p.app}</div>
                        {p.notes && <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>📝 {p.notes}</div>}
                      </div>
                      <button onClick={() => handleDeletePayment(p.id)}
                        style={{ background: "#fff0f0", border: "1px solid #ffcdd2", color: "#e53935", borderRadius: 8, padding: "6px 14px", fontSize: 14, cursor: "pointer" }}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MY CARDS */}
        {page === "cards" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#2c3e50" }}>My Cards</div>
              <button onClick={() => setShowAddCard(!showAddCard)}
                style={{ background: "#2c5f8a", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 16, cursor: "pointer", fontWeight: "bold" }}>
                + Add Card
              </button>
            </div>

            {showAddCard && (
              <div style={{ background: "white", borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 12 }}>Add New Card</div>
                <input placeholder="Card Name (e.g. SBI Credit Card)" value={addCardForm.name} onChange={e => setAddCardForm(f=>({...f, name: e.target.value}))}
                  style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 8, border: "2px solid #ccc", marginBottom: 10, boxSizing: "border-box" }} />
                <input placeholder="Bank Name (e.g. SBI)" value={addCardForm.bank} onChange={e => setAddCardForm(f=>({...f, bank: e.target.value}))}
                  style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 8, border: "2px solid #ccc", marginBottom: 10, boxSizing: "border-box" }} />
                <input type="number" placeholder="Total Bill Amount (₹)" value={addCardForm.totalBill} onChange={e => setAddCardForm(f=>({...f, totalBill: e.target.value}))}
                  style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 8, border: "2px solid #ccc", marginBottom: 10, boxSizing: "border-box" }} />
                <label style={{ fontSize: 14, color: "#666" }}>Due Date</label>
                <input type="date" value={addCardForm.dueDate} onChange={e => setAddCardForm(f=>({...f, dueDate: e.target.value}))}
                  style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 8, border: "2px solid #ccc", marginBottom: 14, boxSizing: "border-box" }} />
                <button onClick={handleAddCard}
                  style={{ width: "100%", padding: 14, background: "#27ae60", color: "white", border: "none", borderRadius: 10, fontSize: 17, fontWeight: "bold", cursor: "pointer" }}>
                  ✓ Save Card
                </button>
              </div>
            )}

            {cards.map(card => {
              const status = getCardStatus(card, payments);
              const paid = getCardPaid(card, payments);
              const s = STATUS_STYLES[status];
              return (
                <div key={card.id} style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: "0 2px 6px rgba(0,0,0,0.06)", border: `2px solid ${s.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: "#1a2a3a" }}>💳 {card.name}</div>
                      <div style={{ fontSize: 14, color: "#777", marginTop: 3 }}>{card.bank} · Due: {formatDate(card.dueDate)}</div>
                      <div style={{ marginTop: 8, fontSize: 15 }}>
                        <span style={{ color: "#555" }}>Bill: </span><strong>{formatINR(card.totalBill)}</strong>
                        <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
                        <span style={{ color: "#27ae60" }}>Paid: </span><strong style={{ color: "#27ae60" }}>{formatINR(paid)}</strong>
                      </div>
                      <div style={{ marginTop: 6, display: "inline-block", background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 16, padding: "4px 12px", fontSize: 14, fontWeight: "bold" }}>
                        {s.label}
                      </div>
                    </div>
                    <button onClick={() => setDeleteConfirm({ type: "card", id: card.id })}
                      style={{ background: "#fff0f0", border: "1px solid #ffcdd2", color: "#e53935", borderRadius: 8, padding: "6px 14px", fontSize: 14, cursor: "pointer" }}>
                      🗑 Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "2px solid #ddd", display: "flex", zIndex: 100 }}>
        {navItems.map(item => (
          <button key={item.key} onClick={() => setPage(item.key)}
            style={{ flex: 1, padding: "12px 4px", border: "none", background: page === item.key ? "#e8f0f8" : "white",
              color: page === item.key ? "#2c5f8a" : "#777", fontSize: 13, fontWeight: page === item.key ? "bold" : "normal",
              cursor: "pointer", borderTop: page === item.key ? "3px solid #2c5f8a" : "3px solid transparent" }}>
            {item.label}
          </button>
        ))}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "white", borderRadius: 18, padding: 28, maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#2c3e50", marginBottom: 10 }}>Are you sure?</div>
            <div style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>
              {deleteConfirm.type === "payment" ? "This payment record will be permanently deleted." : "This card and all its payment records will be removed."}
            </div>
            <button onClick={confirmDelete}
              style={{ width: "100%", padding: 14, background: "#e53935", color: "white", border: "none", borderRadius: 12, fontSize: 18, fontWeight: "bold", cursor: "pointer", marginBottom: 10 }}>
              Yes, Delete
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              style={{ width: "100%", padding: 14, background: "#f5f0e8", color: "#555", border: "2px solid #ccc", borderRadius: 12, fontSize: 16, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#27ae60", color: "white", padding: "14px 28px", borderRadius: 30, fontSize: 16, fontWeight: "bold", zIndex: 300, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
