// =============================================================
// FRAUDSIGHT — UI Renderer & App Controller
// =============================================================

const App = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let state = {
    currentView: "queue",
    currentCase: null,
    filters: { search: "", risk: "ALL", status: "ALL", sort: "risk_desc" },
    alertInterval: null,
    expandedAuditRows: new Set(),
  };

  // ─── INIT ───────────────────────────────────────────────────
  function init() {
    DB.init();
    _updateNavBadges();
    renderView("queue");
    _startAlertSimulation();
  }

  // ─── NAVIGATION ─────────────────────────────────────────────
  function renderView(view, caseId = null) {
    state.currentView = view;
    state.currentCase = caseId;

    document.querySelectorAll(".nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.view === view);
    });

    // Update topbar title
    const titles = {
      queue:   { title: "Case Queue", sub: "Active Investigation Cases" },
      detail:  { title: "Case Detail", sub: `Investigating ${caseId || ""}` },
      alerts:  { title: "Live Alerts", sub: "Real-Time Suspicious Signals" },
      audit:   { title: "Audit Log", sub: "Regulatory Compliance Trace" },
      metrics: { title: "System Insights", sub: "Performance & Analytics" },
    };
    const t = titles[view] || titles.queue;
    document.getElementById("topbar-title").textContent = t.title;
    document.getElementById("topbar-sub").textContent   = t.sub;

    const content = document.getElementById("main-content");

    // Hide/show filter bar
    const filterBar = document.getElementById("filter-bar");
    filterBar.style.display = view === "queue" ? "flex" : "none";

    if (view === "queue")   { content.innerHTML = renderQueue(); bindQueueEvents(); }
    if (view === "detail")  { content.innerHTML = renderDetail(caseId); bindDetailEvents(caseId); }
    if (view === "alerts")  { content.innerHTML = renderAlerts(); bindAlertEvents(); }
    if (view === "audit")   { content.innerHTML = renderAuditLog(); bindAuditEvents(); }
    if (view === "metrics") { content.innerHTML = renderMetrics(); }
  }

  // ─── QUEUE VIEW ─────────────────────────────────────────────
  function renderQueue() {
    const txs = DB.filterTransactions(state.filters);
    const pending = txs.filter(t => t.status === "Pending").length;

    let rows = "";
    if (txs.length === 0) {
      rows = `<tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No cases match your filters</div>
          <div class="empty-sub">Try adjusting the search or filter criteria</div>
        </div></td></tr>`;
    } else {
      txs.forEach((tx, i) => {
        const statusClass = tx.status.replace(" ", ".");
        rows += `
          <tr class="data-row" data-case="${tx.caseId}" style="animation-delay:${i * 0.03}s">
            <td><span class="case-id">${tx.caseId}</span></td>
            <td>
              <div class="user-cell">${tx.user.name}</div>
              <div class="user-id">${tx.user.id}</div>
            </td>
            <td><span class="amount-val">${tx.amountFormatted}</span></td>
            <td><span class="risk-badge ${tx.riskLevel}">${tx.riskLevel}</span></td>
            <td><span class="status-tag ${statusClass}" data-status="${tx.status}">${tx.status}</span></td>
            <td>
              <div class="time-cell">${tx.timeFormatted}</div>
              <div class="time-cell text-muted">${tx.dateFormatted}</div>
            </td>
            <td class="text-mono text-muted text-sm">${tx.txCity}</td>
            <td><button class="btn-view" onclick="App.openCase('${tx.caseId}')">View →</button></td>
          </tr>`;
      });
    }

    return `
      <div class="queue-header">
        <span class="queue-title">// CASE REGISTRY</span>
        <span class="queue-count text-mono">${txs.length} cases · ${pending} pending action</span>
      </div>
      <table class="cases-table">
        <thead>
          <tr>
            <th>CASE ID</th>
            <th>SUBJECT</th>
            <th>AMOUNT</th>
            <th>RISK</th>
            <th>STATUS</th>
            <th>TIMESTAMP</th>
            <th>LOCATION</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function bindQueueEvents() {
    document.querySelectorAll("tr.data-row").forEach(row => {
      row.addEventListener("dblclick", () => openCase(row.dataset.case));
    });
  }

  // ─── DETAIL VIEW ────────────────────────────────────────────
  function renderDetail(caseId) {
    const tx = DB.getTransactionById(caseId);
    if (!tx) return `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Case not found</div></div>`;

    // Run agents fresh each time (shows live analysis)
    const report = AgentOrchestrator.investigate(tx);
    const { anomaly, context, risk, decision, explanation } = report;

    const allFlags = [...anomaly.flags, ...context.signals];

    const isClosed = tx.status === "Closed";

    const flagItems = allFlags.length
      ? allFlags.map(f => `
          <li class="analysis-item severity-${f.severity}">
            <span class="item-dot"></span>
            <span class="item-text">${f.detail}</span>
          </li>`).join("")
      : `<li class="analysis-item severity-LOW"><span class="item-dot"></span><span class="item-text" style="color:var(--risk-low)">No behavioral anomalies detected — transaction appears legitimate</span></li>`;

    const actionBtns = isClosed
      ? `<button class="btn-action closed-indicator" style="cursor:default">✓ Case Closed</button>`
      : `
        <button class="btn-action block"    onclick="App.takeAction('${caseId}','BLOCKED','Block')">
          <span class="btn-icon">🔴</span><span class="btn-label">BLOCK</span>
        </button>
        <button class="btn-action monitor"  onclick="App.takeAction('${caseId}','MONITORED','Monitor')">
          <span class="btn-icon">🟡</span><span class="btn-label">MONITOR</span>
        </button>
        <button class="btn-action escalate" onclick="App.takeAction('${caseId}','ESCALATED','Escalate')">
          <span class="btn-icon">🔵</span><span class="btn-label">ESCALATE</span>
        </button>
        <button class="btn-action approve"  onclick="App.takeAction('${caseId}','APPROVED','Approve')">
          <span class="btn-icon">🟢</span><span class="btn-label">APPROVE</span>
        </button>`;

    return `
      <div class="detail-back" onclick="App.renderView('queue')">← Back to Case Queue</div>

      <div class="detail-header ${risk.riskLevel} fade-in">
        <div class="dh-left">
          <div class="case-num">${tx.caseId}</div>
          <div class="case-meta">${tx.txId} · ${tx.category} · ${tx.bank}</div>
        </div>
        <div class="dh-right">
          <span class="status-tag ${tx.status.replace(' ','.')}" data-status="${tx.status}">${tx.status}</span>
          <div class="risk-gauge-wrap">
            <span class="risk-score-big ${risk.riskLevel}">${(risk.riskScore * 100).toFixed(0)}%</span>
            <div class="risk-gauge-bar">
              <div class="risk-gauge-fill ${risk.riskLevel}" style="width:${risk.riskScore * 100}%"></div>
            </div>
          </div>
          <span class="risk-badge ${risk.riskLevel}">${risk.riskLevel} RISK</span>
        </div>
      </div>

      <div class="info-grid fade-in">
        <div class="info-card">
          <div class="info-card-title">🧾 Transaction Info</div>
          <div class="info-row">
            <span class="info-label">Amount</span>
            <span class="info-value ${tx.amountMultiplier >= 5 ? 'amount-big' : ''}">${tx.amountFormatted}</span>
          </div>
          <div class="info-row">
            <span class="info-label">User Average</span>
            <span class="info-value">${tx.avgFormatted}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Multiplier</span>
            <span class="info-value ${tx.amountMultiplier >= 5 ? 'flagged' : 'ok'}">${tx.amountMultiplier}×</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value ${tx.nightActivity ? 'flagged' : ''}">${tx.timeFormatted}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value ${tx.locationMismatch ? 'flagged' : 'ok'}">${tx.txCity}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Category</span>
            <span class="info-value">${tx.category}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-title">👤 User Profile</div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${tx.user.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">User ID</span>
            <span class="info-value">${tx.user.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Home City</span>
            <span class="info-value">${tx.user.city}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Account Age</span>
            <span class="info-value ${tx.user.accountAge < 120 ? 'flagged' : 'ok'}">${tx.user.accountAge} days</span>
          </div>
          <div class="info-row">
            <span class="info-label">Risk Profile</span>
            <span class="info-value">${tx.user.riskProfile}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Bank</span>
            <span class="info-value">${tx.bank}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-title">📱 Device & Network</div>
          <div class="info-row">
            <span class="info-label">Device</span>
            <span class="info-value ${tx.newDevice ? 'flagged' : 'ok'}">${tx.device}</span>
          </div>
          <div class="info-row">
            <span class="info-label">New Device</span>
            <span class="info-value ${tx.newDevice ? 'flagged' : 'ok'}">${tx.newDevice ? '⚠ YES' : '✓ NO'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">IP Changed</span>
            <span class="info-value ${tx.ipChanged ? 'flagged' : 'ok'}">${tx.ipChanged ? '⚠ YES' : '✓ NO'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Rapid Sequence</span>
            <span class="info-value ${tx.rapidSequence ? 'flagged' : 'ok'}">${tx.rapidSequence ? '⚠ YES' : '✓ NO'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Merchant ID</span>
            <span class="info-value">${tx.merchantId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location Match</span>
            <span class="info-value ${tx.locationMismatch ? 'flagged' : 'ok'}">${tx.locationMismatch ? '⚠ Mismatch' : '✓ Match'}</span>
          </div>
        </div>
      </div>

      <div class="analysis-card fade-in">
        <div class="card-title">📊 Behavioral Analysis — Agent Signals</div>
        <ul class="analysis-list">${flagItems}</ul>
      </div>

      <div class="ai-card fade-in">
        <div class="ai-label">🤖 AI Investigation Report — ExplanationAgent</div>
        <div class="ai-narrative">${explanation.narrative}</div>
        <div class="ai-sub">Recommended Action: ${explanation.actionRationale}</div>
        <div class="ai-meta">
          <div class="ai-meta-item">Risk Probability: <span>${explanation.readableRisk}</span></div>
          <div class="ai-meta-item">Model Confidence: <span>${explanation.confidence}</span></div>
          <div class="ai-meta-item">Signals Detected: <span>${allFlags.length}</span></div>
        </div>
      </div>

      <div class="action-card fade-in">
        <div class="action-label">⚖️ Recommended Action — DecisionAgent</div>
        <div class="action-recommended">
          ${decision.label} — ${decision.rationale}
        </div>
        <div class="action-buttons">${actionBtns}</div>
      </div>`;
  }

  function bindDetailEvents(caseId) {}

  // ─── ALERTS VIEW ─────────────────────────────────────────────
  function renderAlerts() {
    const alerts = DB.getAlerts();
    const items = alerts.map((a, i) => {
      const timeAgo = _timeAgo(a.timestamp);
      const unread  = !a.read ? "unread" : "";
      return `
        <div class="alert-item ${unread} ${a.level}" data-alert="${a.id}" data-case="${a.caseId}" style="animation-delay:${i*0.05}s">
          <div class="alert-level">
            <span class="risk-badge ${a.level}">${a.level}</span>
          </div>
          <div class="alert-message">${a.message}</div>
          <div class="alert-time">${timeAgo}</div>
          <button class="alert-action" onclick="App.openCase('${a.caseId}')">Investigate →</button>
        </div>`;
    });

    return `
      <div class="section-header">
        <div>
          <div class="section-title">Live Alert Stream</div>
          <div class="section-mono">${alerts.filter(a=>!a.read).length} unread signals</div>
        </div>
        <span class="live-tag">LIVE</span>
      </div>
      <div class="alerts-feed">${items.join("") || `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">All clear</div><div class="empty-sub">No active alerts at this time</div></div>`}</div>`;
  }

  function bindAlertEvents() {
    document.querySelectorAll(".alert-item[data-alert]").forEach(el => {
      el.addEventListener("click", () => {
        DB.markAlertRead(el.dataset.alert);
        el.classList.remove("unread");
        _updateNavBadges();
      });
    });
  }

  // ─── AUDIT LOG VIEW ──────────────────────────────────────────
  function renderAuditLog() {
    const logs = DB.getAuditLogs();
    const txs  = DB.getAllTransactions().filter(t => t.auditLog && t.auditLog.length);

    const rows = txs.map(tx => {
      const log = tx.auditLog[tx.auditLog.length - 1];
      const actionClass = log.action;
      const ts = new Date(log.timestamp).toLocaleString("en-IN", { hour12: true });
      return `
        <tr class="audit-row" onclick="App.toggleAuditExpand('${tx.caseId}')">
          <td><span class="case-id">${tx.caseId}</span></td>
          <td>${tx.user.name} <span class="text-muted text-mono text-sm">${tx.user.id}</span></td>
          <td>${tx.amountFormatted}</td>
          <td><span class="action-taken ${actionClass}">${actionClass}</span></td>
          <td class="text-mono text-sm text-muted">${log.reason}</td>
          <td class="text-mono text-sm text-muted">${ts}</td>
        </tr>
        <tr id="expand-${tx.caseId}"><td colspan="6" style="padding:0">
          <div class="audit-expand ${state.expandedAuditRows.has(tx.caseId) ? 'open' : ''}" id="expand-body-${tx.caseId}">
            <strong>Full Investigation Report:</strong><br>
            Amount: ${tx.amountFormatted} (${tx.amountMultiplier}× user average)<br>
            Location mismatch: ${tx.locationMismatch ? "YES — " + tx.user.city + " → " + tx.txCity : "No"}<br>
            New device: ${tx.newDevice ? "YES" : "No"} · IP changed: ${tx.ipChanged ? "YES" : "No"}<br>
            Night activity: ${tx.nightActivity ? "YES" : "No"} · Rapid sequence: ${tx.rapidSequence ? "YES" : "No"}<br>
            Risk signals: ${tx.reasons.join(" · ")}<br>
            <strong>Decision Confidence: ${(log.confidence * 100).toFixed(0)}%</strong>
          </div>
        </td></tr>`;
    });

    return `
      <div class="section-header mb-4">
        <div>
          <div class="section-title">Audit Trail</div>
          <div class="section-mono">Regulatory compliance — immutable action log</div>
        </div>
        <span class="text-mono text-sm text-muted">${txs.length} resolved cases</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:var(--bg-panel);border-bottom:1px solid var(--border)">
            <th style="padding:10px 16px;text-align:left;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:.12em;text-transform:uppercase">CASE ID</th>
            <th style="padding:10px 16px;text-align:left;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:.12em;text-transform:uppercase">SUBJECT</th>
            <th style="padding:10px 16px;text-align:left;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:.12em;text-transform:uppercase">AMOUNT</th>
            <th style="padding:10px 16px;text-align:left;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:.12em;text-transform:uppercase">ACTION</th>
            <th style="padding:10px 16px;text-align:left;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:.12em;text-transform:uppercase">REASON</th>
            <th style="padding:10px 16px;text-align:left;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:.12em;text-transform:uppercase">TIMESTAMP</th>
          </tr>
        </thead>
        <tbody>${rows.join("") || `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No closed cases yet</div></div></td></tr>`}</tbody>
      </table>`;
  }

  function bindAuditEvents() {}

  function toggleAuditExpand(caseId) {
    const body = document.getElementById(`expand-body-${caseId}`);
    if (!body) return;
    if (state.expandedAuditRows.has(caseId)) {
      state.expandedAuditRows.delete(caseId);
      body.classList.remove("open");
    } else {
      state.expandedAuditRows.add(caseId);
      body.classList.add("open");
    }
  }

  // ─── METRICS VIEW ────────────────────────────────────────────
  function renderMetrics() {
    const m  = DB.getMetrics();
    const txs = DB.getAllTransactions();

    const scenarioCounts = {};
    txs.forEach(t => { scenarioCounts[t.scenario] = (scenarioCounts[t.scenario] || 0) + 1; });
    const maxS = Math.max(...Object.values(scenarioCounts));

    const scenarioLabels = {
      sudden_large_transfer: "Sudden Large Transfer",
      location_change: "Location Change",
      rapid_transactions: "Rapid Transactions",
      new_device: "New Device",
      night_activity: "Night Activity",
      multiple_anomalies: "Multiple Anomalies",
      normal: "Normal (No Fraud)",
    };

    const scenarioBars = Object.entries(scenarioCounts).map(([k, v]) => `
      <div class="scenario-row">
        <span class="scenario-label">${scenarioLabels[k] || k}</span>
        <div class="scenario-bar-wrap">
          <div class="scenario-bar-fill" style="width:${(v/maxS*100).toFixed(0)}%"></div>
        </div>
        <span class="scenario-num">${v}</span>
      </div>`).join("");

    return `
      <div class="section-header mb-4">
        <div class="section-title">System Insights</div>
        <span class="section-mono">FraudSight Analytics Dashboard</span>
      </div>

      <div class="metrics-grid">
        <div class="metric-card blue">
          <div class="metric-label">Total Cases</div>
          <div class="metric-value blue">${m.total}</div>
          <div class="metric-sub">All investigations</div>
        </div>
        <div class="metric-card red">
          <div class="metric-label">Fraud Detected</div>
          <div class="metric-value red">${m.fraud}</div>
          <div class="metric-sub">High-risk cases</div>
        </div>
        <div class="metric-card green">
          <div class="metric-label">Reviewed</div>
          <div class="metric-value green">${m.reviewed}</div>
          <div class="metric-sub">Resolved cases</div>
        </div>
        <div class="metric-card amber">
          <div class="metric-label">False Positive Rate</div>
          <div class="metric-value amber">${m.falsePositives}%</div>
          <div class="metric-sub">Below 10% target ✓</div>
        </div>
      </div>

      <div class="pipeline-card fade-in">
        <div class="card-title">⚙️ Agent Pipeline Architecture</div>
        <div class="pipeline-flow">
          <div class="pipeline-step"><div class="p-node">Transaction Input</div><div class="p-arrow">→</div></div>
          <div class="pipeline-step"><div class="p-node">AnomalyAgent</div><div class="p-arrow">→</div></div>
          <div class="pipeline-step"><div class="p-node">ContextAgent</div><div class="p-arrow">→</div></div>
          <div class="pipeline-step"><div class="p-node">RiskAgent</div><div class="p-arrow">→</div></div>
          <div class="pipeline-step"><div class="p-node">DecisionAgent</div><div class="p-arrow">→</div></div>
          <div class="pipeline-step"><div class="p-node">ExplanationAgent</div><div class="p-arrow">→</div></div>
          <div class="p-node" style="background:var(--bg-selected);border-color:var(--accent-blue);color:var(--accent-blue)">Analyst Review</div>
        </div>
      </div>

      <div class="analysis-card fade-in">
        <div class="card-title">📊 Fraud Scenario Breakdown</div>
        <div class="scenario-bars">${scenarioBars}</div>
      </div>`;
  }

  // ─── ACTIONS ────────────────────────────────────────────────
  function takeAction(caseId, action, label) {
    const statusMap = { BLOCKED: "Closed", APPROVED: "Closed", ESCALATED: "Under Review", MONITORED: "Under Review" };
    const newStatus = statusMap[action] || "Closed";
    const success = DB.updateTransactionStatus(caseId, newStatus, action);
    if (success) {
      const icons = { BLOCKED: "🔴", APPROVED: "✅", ESCALATED: "🔵", MONITORED: "🟡" };
      showToast(`${icons[action]} Case ${caseId} — ${action}`, action === "BLOCKED" ? "error" : action === "APPROVED" ? "success" : "info");
      _updateNavBadges();
      setTimeout(() => renderView("queue"), 800);
    }
  }

  function openCase(caseId) {
    renderView("detail", caseId);
  }

  // ─── FILTER HANDLING ─────────────────────────────────────────
  function applyFilters() {
    state.filters.search = document.getElementById("search-input")?.value || "";
    state.filters.risk   = document.getElementById("filter-risk")?.value || "ALL";
    state.filters.status = document.getElementById("filter-status")?.value || "ALL";
    state.filters.sort   = document.getElementById("filter-sort")?.value || "risk_desc";
    document.getElementById("main-content").innerHTML = renderQueue();
    bindQueueEvents();
  }

  // ─── UTILITIES ────────────────────────────────────────────────
  function _updateNavBadges() {
    const txs    = DB.getAllTransactions();
    const alerts = DB.getAlerts();
    const pending = txs.filter(t => t.status === "Pending").length;
    const unread  = alerts.filter(a => !a.read).length;

    const queueBadge  = document.getElementById("badge-queue");
    const alertsBadge = document.getElementById("badge-alerts");
    if (queueBadge)  queueBadge.textContent  = pending;
    if (alertsBadge) alertsBadge.textContent = unread;
  }

  function _timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h/24)}d ago`;
    if (h > 0)  return `${h}h ago`;
    if (m > 0)  return `${m}m ago`;
    return "just now";
  }

  function _startAlertSimulation() {
    // Simulate a new alert every 30 seconds to feel "live"
    state.alertInterval = setInterval(() => {
      if (state.currentView === "alerts") {
        renderView("alerts");
      }
      _updateNavBadges();
    }, 30000);
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  return {
    init,
    renderView,
    openCase,
    takeAction,
    applyFilters,
    toggleAuditExpand,
    showToast,
  };
})();

window.App = App;