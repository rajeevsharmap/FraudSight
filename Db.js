// =============================================================
// FRAUDSIGHT — Database Layer (localStorage)
// =============================================================

const DB = (() => {
  const KEYS = {
    TRANSACTIONS: "fs_transactions",
    AUDIT_LOGS:   "fs_audit_logs",
    ALERTS:       "fs_alerts",
    METRICS:      "fs_metrics",
  };

  function init() {
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      const data = window.FraudData.TRANSACTIONS;
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data));
      _buildAlerts(data);
      _buildMetrics(data);
      console.log(`[DB] Initialized with ${data.length} transactions`);
    }
  }

  function _buildAlerts(txs) {
    const highRisk = txs
      .filter(t => t.riskLevel !== "LOW" && t.status !== "Closed")
      .slice(0, 15)
      .map(t => ({
        id: `ALT-${t.caseId}`,
        level: t.riskLevel,
        message: `${t.amountFormatted} from ${t.newDevice ? "new device" : t.txCity !== t.user.city ? "new location" : "suspicious pattern"} → ${t.user.name}`,
        caseId: t.caseId,
        timestamp: t.timestamp,
        read: false,
      }));
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(highRisk));
  }

  function _buildMetrics(txs) {
    const total = txs.length;
    const fraud = txs.filter(t => t.riskScore >= 0.70).length;
    const reviewed = txs.filter(t => t.status === "Closed").length;
    const pending = txs.filter(t => t.status === "Pending").length;
    const fp = Math.round((fraud * 0.08) * 10) / 10;
    const metrics = { total, fraud, reviewed, pending, falsePositives: fp, accuracy: 0.94 };
    localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics));
  }

  // ─── TRANSACTIONS ──────────────────────────────────────────
  function getAllTransactions() {
    return JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || "[]");
  }

  function getTransactionById(caseId) {
    return getAllTransactions().find(t => t.caseId === caseId) || null;
  }

  function updateTransactionStatus(caseId, newStatus, action, analystNote = "") {
    const txs = getAllTransactions();
    const idx = txs.findIndex(t => t.caseId === caseId);
    if (idx === -1) return false;

    txs[idx].status = newStatus;
    txs[idx].auditLog = txs[idx].auditLog || [];
    const logEntry = {
      action,
      by: "Analyst",
      reason: analystNote || txs[idx].recommendation.reason,
      timestamp: new Date().toISOString(),
      confidence: txs[idx].riskScore,
    };
    txs[idx].auditLog.push(logEntry);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));

    // Add to global audit log
    const logs = getAuditLogs();
    logs.unshift({ ...logEntry, caseId, amount: txs[idx].amountFormatted, user: txs[idx].user.name });
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    return true;
  }

  function filterTransactions({ search = "", risk = "ALL", status = "ALL", sort = "newest" } = {}) {
    let txs = getAllTransactions();
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(t =>
        t.caseId.toLowerCase().includes(q) ||
        t.user.name.toLowerCase().includes(q) ||
        t.user.id.toLowerCase().includes(q) ||
        t.txCity.toLowerCase().includes(q)
      );
    }
    if (risk !== "ALL") txs = txs.filter(t => t.riskLevel === risk);
    if (status !== "ALL") txs = txs.filter(t => t.status === status);

    txs.sort((a, b) => {
      if (sort === "newest")    return new Date(b.timestamp) - new Date(a.timestamp);
      if (sort === "oldest")    return new Date(a.timestamp) - new Date(b.timestamp);
      if (sort === "risk_desc") return b.riskScore - a.riskScore;
      if (sort === "risk_asc")  return a.riskScore - b.riskScore;
      if (sort === "amount")    return b.amount - a.amount;
      return 0;
    });
    return txs;
  }

  // ─── AUDIT LOGS ────────────────────────────────────────────
  function getAuditLogs() {
    return JSON.parse(localStorage.getItem(KEYS.AUDIT_LOGS) || "[]");
  }

  // ─── ALERTS ────────────────────────────────────────────────
  function getAlerts() {
    return JSON.parse(localStorage.getItem(KEYS.ALERTS) || "[]");
  }

  function markAlertRead(alertId) {
    const alerts = getAlerts();
    const a = alerts.find(a => a.id === alertId);
    if (a) { a.read = true; localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts)); }
  }

  // ─── METRICS ───────────────────────────────────────────────
  function getMetrics() {
    return JSON.parse(localStorage.getItem(KEYS.METRICS) || "{}");
  }

  // ─── RESET ─────────────────────────────────────────────────
  function reset() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    init();
  }

  return { init, getAllTransactions, getTransactionById, updateTransactionStatus, filterTransactions, getAuditLogs, getAlerts, markAlertRead, getMetrics, reset };
})();

window.DB = DB;