// =============================================================
// FRAUDSIGHT — Multi-Agent Investigation Orchestrator
// Agents: Anomaly | Context | Risk | Decision | Explanation
// =============================================================

const AgentOrchestrator = (() => {

  // ─── AGENT 1: ANOMALY AGENT ────────────────────────────────
  // Detects statistical deviations from normal user behavior
  function anomalyAgent(tx) {
    const flags = [];
    let score = 0;

    // Amount anomaly
    const multiplier = tx.amount / tx.user.avgTx;
    if (multiplier >= 20)      { flags.push({ type: "amount", severity: "CRITICAL", detail: `Amount is ${Math.round(multiplier)}× above average` }); score += 0.40; }
    else if (multiplier >= 10) { flags.push({ type: "amount", severity: "HIGH",     detail: `Amount is ${Math.round(multiplier)}× above average` }); score += 0.30; }
    else if (multiplier >= 4)  { flags.push({ type: "amount", severity: "MEDIUM",   detail: `Amount is ${Math.round(multiplier)}× above average` }); score += 0.15; }
    else if (multiplier >= 2)  { flags.push({ type: "amount", severity: "LOW",      detail: `Amount is ${Math.round(multiplier)}× above average` }); score += 0.05; }

    // Rapid-sequence anomaly
    if (tx.rapidSequence) { flags.push({ type: "velocity", severity: "HIGH", detail: "3+ transactions in under 10 minutes" }); score += 0.18; }

    // Night-time anomaly
    if (tx.nightActivity) { flags.push({ type: "timing", severity: "MEDIUM", detail: "Transaction at unusual hours (midnight–4AM)" }); score += 0.12; }

    return {
      agent: "AnomalyAgent",
      flags,
      anomalyScore: Math.min(0.99, parseFloat(score.toFixed(2))),
      triggered: flags.length > 0,
    };
  }

  // ─── AGENT 2: CONTEXT AGENT ────────────────────────────────
  // Enriches with device, location, and IP context
  function contextAgent(tx) {
    const signals = [];
    let contextRisk = 0;

    if (tx.locationMismatch) {
      signals.push({ type: "location", severity: "HIGH", detail: `City changed: ${tx.user.city} → ${tx.txCity}` });
      contextRisk += 0.22;
    }
    if (tx.newDevice) {
      signals.push({ type: "device", severity: "HIGH", detail: `Unrecognized device: ${tx.device}` });
      contextRisk += 0.20;
    }
    if (tx.ipChanged) {
      signals.push({ type: "network", severity: "MEDIUM", detail: "IP address changed from last authenticated session" });
      contextRisk += 0.15;
    }

    // Account tenure
    if (tx.user.accountAge < 90) {
      signals.push({ type: "account", severity: "MEDIUM", detail: "Account is relatively new (< 90 days)" });
      contextRisk += 0.10;
    }

    return {
      agent: "ContextAgent",
      signals,
      contextRiskScore: Math.min(0.99, parseFloat(contextRisk.toFixed(2))),
      summary: signals.length === 0 ? "No contextual anomalies detected" : `${signals.length} contextual signal(s) identified`,
    };
  }

  // ─── AGENT 3: RISK AGENT ───────────────────────────────────
  // Combines anomaly + context into unified risk score
  function riskAgent(anomalyResult, contextResult, tx) {
    const combined = (anomalyResult.anomalyScore * 0.55) + (contextResult.contextRiskScore * 0.45);
    const finalScore = Math.min(0.99, parseFloat(combined.toFixed(2)));
    const level = finalScore >= 0.70 ? "HIGH" : finalScore >= 0.40 ? "MEDIUM" : "LOW";

    // Confidence calculation
    const totalSignals = anomalyResult.flags.length + contextResult.signals.length;
    const confidence = Math.min(0.99, 0.60 + totalSignals * 0.06);

    return {
      agent: "RiskAgent",
      riskScore: finalScore,
      riskLevel: level,
      confidence: parseFloat(confidence.toFixed(2)),
      breakdown: {
        anomalyContribution: parseFloat((anomalyResult.anomalyScore * 0.55).toFixed(2)),
        contextContribution: parseFloat((contextResult.contextRiskScore * 0.45).toFixed(2)),
      },
    };
  }

  // ─── AGENT 4: DECISION AGENT ───────────────────────────────
  // Produces final recommended action
  function decisionAgent(riskResult, anomalyResult, contextResult) {
    const { riskScore, riskLevel, confidence } = riskResult;
    let action, label, rationale;

    if (riskScore >= 0.80) {
      action = "BLOCK";
      label = "Block Transaction Immediately";
      rationale = "Multiple high-severity signals warrant immediate blocking to prevent financial loss.";
    } else if (riskScore >= 0.65) {
      action = "ESCALATE";
      label = "Escalate to Senior Investigator";
      rationale = "Risk score above threshold — requires senior analyst judgment before processing.";
    } else if (riskScore >= 0.40) {
      action = "MONITOR";
      label = "Flag & Monitor User Activity";
      rationale = "Moderate risk detected — approve with enhanced monitoring for 72 hours.";
    } else {
      action = "APPROVE";
      label = "Approve Transaction";
      rationale = "Transaction falls within acceptable behavioral parameters.";
    }

    return {
      agent: "DecisionAgent",
      action,
      label,
      rationale,
      riskScore,
      riskLevel,
      confidence,
    };
  }

  // ─── AGENT 5: EXPLANATION AGENT ────────────────────────────
  // Builds human-readable narrative for analysts and regulators
  function explanationAgent(tx, anomalyResult, contextResult, riskResult, decisionResult) {
    const allSignals = [
      ...anomalyResult.flags.map(f => f.detail),
      ...contextResult.signals.map(s => s.detail),
    ];

    // Primary narrative
    let narrative = "";
    if (allSignals.length === 0) {
      narrative = `Transaction of ${tx.amountFormatted} by ${tx.user.name} is consistent with historical patterns. No significant deviations detected.`;
    } else {
      const parts = allSignals.slice(0, 3).join("; ");
      narrative = `Transaction flagged due to: ${parts}. Combined risk score of ${(riskResult.riskScore * 100).toFixed(0)}% exceeds ${riskResult.riskLevel === "HIGH" ? "critical" : "moderate"} threshold.`;
    }

    // Why action was recommended
    const actionRationale = `Recommended to ${decisionResult.label.toLowerCase()} — ${decisionResult.rationale}`;

    return {
      agent: "ExplanationAgent",
      narrative,
      actionRationale,
      allSignals,
      readableRisk: `${(riskResult.riskScore * 100).toFixed(0)}% risk probability`,
      confidence: `${(riskResult.confidence * 100).toFixed(0)}% model confidence`,
    };
  }

  // ─── ORCHESTRATOR ──────────────────────────────────────────
  // Full pipeline: Input → All Agents → Final Report
  function investigate(tx) {
    const anomaly    = anomalyAgent(tx);
    const context    = contextAgent(tx);
    const risk       = riskAgent(anomaly, context, tx);
    const decision   = decisionAgent(risk, anomaly, context);
    const explanation = explanationAgent(tx, anomaly, context, risk, decision);

    return {
      caseId: tx.caseId,
      pipeline: ["AnomalyAgent", "ContextAgent", "RiskAgent", "DecisionAgent", "ExplanationAgent"],
      anomaly,
      context,
      risk,
      decision,
      explanation,
      processedAt: new Date().toISOString(),
    };
  }

  return { investigate, anomalyAgent, contextAgent, riskAgent, decisionAgent, explanationAgent };
})();

window.AgentOrchestrator = AgentOrchestrator;