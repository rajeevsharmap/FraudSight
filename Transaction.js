// =============================================================
// FRAUDSIGHT — Simulated Transaction Data
// 50 transactions across multiple fraud scenario categories
// =============================================================

const FRAUD_SCENARIOS = {
  SUDDEN_LARGE_TRANSFER: "sudden_large_transfer",
  LOCATION_CHANGE: "location_change",
  RAPID_TRANSACTIONS: "rapid_transactions",
  NEW_DEVICE: "new_device",
  NIGHT_ACTIVITY: "night_activity",
  MULTIPLE_ANOMALIES: "multiple_anomalies",
  NORMAL: "normal",
};

const USERS = [
  { id: "U001", name: "Arjun Mehta",    city: "Mumbai",    avgTx: 4200,  accountAge: 840, riskProfile: "Low"    },
  { id: "U002", name: "Priya Sharma",   city: "Bangalore", avgTx: 6800,  accountAge: 1200, riskProfile: "Low"   },
  { id: "U003", name: "Rohit Verma",    city: "Delhi",     avgTx: 12000, accountAge: 320,  riskProfile: "Medium"},
  { id: "U004", name: "Sneha Patil",    city: "Pune",      avgTx: 3100,  accountAge: 560,  riskProfile: "Low"   },
  { id: "U005", name: "Kiran Das",      city: "Chennai",   avgTx: 8500,  accountAge: 210,  riskProfile: "Medium"},
  { id: "U006", name: "Deepa Nair",     city: "Hyderabad", avgTx: 5200,  accountAge: 980,  riskProfile: "Low"   },
  { id: "U007", name: "Amit Joshi",     city: "Kolkata",   avgTx: 2800,  accountAge: 450,  riskProfile: "Low"   },
  { id: "U008", name: "Meera Iyer",     city: "Ahmedabad", avgTx: 15000, accountAge: 730,  riskProfile: "Medium"},
  { id: "U009", name: "Suresh Kumar",   city: "Jaipur",    avgTx: 4600,  accountAge: 290,  riskProfile: "Low"   },
  { id: "U010", name: "Aarti Singh",    city: "Lucknow",   avgTx: 3800,  accountAge: 620,  riskProfile: "Low"   },
];

const DEVICES = ["Android (Samsung)", "iPhone 14", "Android (OnePlus)", "Desktop Chrome", "iPad Pro", "Android (Redmi)", "iPhone 13"];
const BANKS = ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Yes Bank"];
const CATEGORIES = ["UPI Transfer", "NEFT", "RTGS", "IMPS", "Merchant Payment", "International Wire"];

function generateCaseId(index) {
  return `C${String(1000 + index).padStart(4, "0")}`;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(hour, min) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ampm}`;
}

function buildExplanation(tx) {
  const reasons = [];
  if (tx.amountMultiplier >= 10) reasons.push(`Amount is ${tx.amountMultiplier}× higher than user average`);
  if (tx.locationMismatch) reasons.push(`Location changed from ${tx.user.city} to ${tx.txCity}`);
  if (tx.newDevice) reasons.push("Transaction from an unrecognized new device");
  if (tx.ipChanged) reasons.push("IP address changed since last session");
  if (tx.nightActivity) reasons.push("Unusual activity at night hours");
  if (tx.rapidSequence) reasons.push("Part of a rapid transaction sequence (3 in 8 minutes)");
  if (reasons.length === 0) reasons.push("Behavior within normal parameters");
  return reasons;
}

function buildRecommendation(riskScore, reasons) {
  if (riskScore >= 0.80) return { action: "BLOCK", label: "Block Transaction", reason: "High anomaly score with multiple risk indicators" };
  if (riskScore >= 0.55) return { action: "ESCALATE", label: "Escalate to Senior", reason: "Moderate risk — requires human review" };
  if (riskScore >= 0.30) return { action: "MONITOR", label: "Monitor User", reason: "Minor deviation — flag for pattern tracking" };
  return { action: "APPROVE", label: "Approve", reason: "Transaction consistent with user behavior" };
}

// ─────────────────────────────────────────────
// RAW TRANSACTION DEFINITIONS (50 entries)
// ─────────────────────────────────────────────
const RAW_TRANSACTIONS = [
  // Fraud Group 1: Sudden Large Transfers
  { userIdx:0, amount:88000,  hour:2,  min:14, txCity:"Delhi",     newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
  { userIdx:1, amount:120000, hour:3,  min:45, txCity:"Mumbai",    newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.SUDDEN_LARGE_TRANSFER, status:"Pending" },
  { userIdx:2, amount:95000,  hour:14, min:20, txCity:"Delhi",     newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.SUDDEN_LARGE_TRANSFER, status:"Pending" },
  { userIdx:3, amount:74000,  hour:22, min:55, txCity:"Pune",      newDevice:true,  ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.SUDDEN_LARGE_TRANSFER, status:"Pending" },
  { userIdx:4, amount:250000, hour:1,  min:5,  txCity:"Hyderabad", newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },

  // Fraud Group 2: Location Change
  { userIdx:5, amount:15000,  hour:10, min:30, txCity:"Kolkata",   newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Pending"    },
  { userIdx:6, amount:9500,   hour:16, min:10, txCity:"Chennai",   newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Pending"    },
  { userIdx:7, amount:48000,  hour:11, min:50, txCity:"Jaipur",    newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Pending"    },
  { userIdx:8, amount:6200,   hour:9,  min:15, txCity:"Delhi",     newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Under Review"},
  { userIdx:9, amount:11000,  hour:13, min:40, txCity:"Bangalore", newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Under Review"},

  // Fraud Group 3: Rapid Transactions
  { userIdx:0, amount:5000,   hour:18, min:2,  txCity:"Mumbai",    newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:true,  scenario: FRAUD_SCENARIOS.RAPID_TRANSACTIONS, status:"Pending"  },
  { userIdx:0, amount:4800,   hour:18, min:5,  txCity:"Mumbai",    newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:true,  scenario: FRAUD_SCENARIOS.RAPID_TRANSACTIONS, status:"Pending"  },
  { userIdx:0, amount:5100,   hour:18, min:10, txCity:"Mumbai",    newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:true,  scenario: FRAUD_SCENARIOS.RAPID_TRANSACTIONS, status:"Pending"  },
  { userIdx:3, amount:3200,   hour:20, min:3,  txCity:"Pune",      newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:true,  scenario: FRAUD_SCENARIOS.RAPID_TRANSACTIONS, status:"Pending"  },
  { userIdx:3, amount:3100,   hour:20, min:7,  txCity:"Pune",      newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:true,  scenario: FRAUD_SCENARIOS.RAPID_TRANSACTIONS, status:"Pending"  },

  // Fraud Group 4: New Device
  { userIdx:1, amount:7200,   hour:15, min:22, txCity:"Bangalore", newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Pending"         },
  { userIdx:2, amount:13000,  hour:11, min:5,  txCity:"Delhi",     newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Under Review"    },
  { userIdx:5, amount:5500,   hour:17, min:45, txCity:"Hyderabad", newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Pending"         },
  { userIdx:6, amount:3400,   hour:14, min:30, txCity:"Kolkata",   newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Pending"         },
  { userIdx:9, amount:8100,   hour:12, min:20, txCity:"Lucknow",   newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Under Review"    },

  // Fraud Group 5: Night Activity
  { userIdx:4, amount:9200,   hour:1,  min:33, txCity:"Chennai",   newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Pending"      },
  { userIdx:7, amount:6700,   hour:3,  min:12, txCity:"Ahmedabad", newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Pending"      },
  { userIdx:8, amount:18000,  hour:2,  min:48, txCity:"Ahmedabad", newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Under Review"  },
  { userIdx:9, amount:4500,   hour:4,  min:5,  txCity:"Lucknow",   newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Pending"      },
  { userIdx:0, amount:11500,  hour:2,  min:59, txCity:"Mumbai",    newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Pending"      },

  // Multi-Anomaly High Risk
  { userIdx:1, amount:180000, hour:0,  min:17, txCity:"Jaipur",    newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
  { userIdx:2, amount:95000,  hour:23, min:58, txCity:"Mumbai",    newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:true,  scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
  { userIdx:3, amount:62000,  hour:3,  min:30, txCity:"Bangalore", newDevice:true,  ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
  { userIdx:5, amount:78000,  hour:1,  min:45, txCity:"Delhi",     newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
  { userIdx:7, amount:145000, hour:2,  min:20, txCity:"Chennai",   newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },

  // Reviewed / Closed (normal and low-risk)
  { userIdx:0, amount:3800,   hour:11, min:20, txCity:"Mumbai",    newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:1, amount:6500,   hour:14, min:5,  txCity:"Bangalore", newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:2, amount:11000,  hour:10, min:45, txCity:"Delhi",     newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:3, amount:2900,   hour:16, min:30, txCity:"Pune",      newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:4, amount:8200,   hour:9,  min:10, txCity:"Chennai",   newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:5, amount:5100,   hour:13, min:55, txCity:"Hyderabad", newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:6, amount:2700,   hour:15, min:40, txCity:"Kolkata",   newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:7, amount:14500,  hour:11, min:0,  txCity:"Ahmedabad", newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:8, amount:4100,   hour:10, min:25, txCity:"Jaipur",    newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:9, amount:3600,   hour:12, min:15, txCity:"Lucknow",   newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },

  // Mixed medium-risk
  { userIdx:0, amount:18000,  hour:22, min:10, txCity:"Mumbai",    newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Under Review" },
  { userIdx:4, amount:27000,  hour:8,  min:30, txCity:"Hyderabad", newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Under Review"    },
  { userIdx:6, amount:12000,  hour:14, min:20, txCity:"Bangalore", newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Under Review"},
  { userIdx:8, amount:35000,  hour:20, min:5,  txCity:"Delhi",     newDevice:false, ipChanged:true,  nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.LOCATION_CHANGE, status:"Under Review"},
  { userIdx:1, amount:22000,  hour:23, min:30, txCity:"Bangalore", newDevice:false, ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.NIGHT_ACTIVITY, status:"Pending"      },
  { userIdx:9, amount:41000,  hour:1,  min:10, txCity:"Mumbai",    newDevice:true,  ipChanged:false, nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
  { userIdx:2, amount:6000,   hour:18, min:0,  txCity:"Delhi",     newDevice:true,  ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NEW_DEVICE, status:"Pending"         },
  { userIdx:5, amount:8000,   hour:19, min:45, txCity:"Hyderabad", newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:true,  scenario: FRAUD_SCENARIOS.RAPID_TRANSACTIONS, status:"Pending" },
  { userIdx:3, amount:4500,   hour:7,  min:55, txCity:"Pune",      newDevice:false, ipChanged:false, nightActivity:false, rapidSequence:false, scenario: FRAUD_SCENARIOS.NORMAL, status:"Closed"              },
  { userIdx:7, amount:55000,  hour:3,  min:5,  txCity:"Kolkata",   newDevice:true,  ipChanged:true,  nightActivity:true,  rapidSequence:false, scenario: FRAUD_SCENARIOS.MULTIPLE_ANOMALIES, status:"Pending"  },
];

// ─────────────────────────────────────────────
// BUILD FULL TRANSACTION OBJECTS
// ─────────────────────────────────────────────
function buildTransactions() {
  const today = new Date();

  return RAW_TRANSACTIONS.map((raw, index) => {
    const user = USERS[raw.userIdx];
    const amountMultiplier = Math.round((raw.amount / user.avgTx) * 10) / 10;

    // Risk score computation (agent-style)
    let riskScore = 0;
    if (amountMultiplier >= 15)       riskScore += 0.35;
    else if (amountMultiplier >= 8)   riskScore += 0.25;
    else if (amountMultiplier >= 3)   riskScore += 0.10;
    if (raw.newDevice)                riskScore += 0.20;
    if (raw.ipChanged)                riskScore += 0.15;
    if (raw.nightActivity)            riskScore += 0.15;
    if (raw.rapidSequence)            riskScore += 0.18;
    if (raw.txCity !== user.city)     riskScore += 0.12;
    riskScore = Math.min(0.99, parseFloat(riskScore.toFixed(2)));

    const riskLevel = riskScore >= 0.70 ? "HIGH" : riskScore >= 0.40 ? "MEDIUM" : "LOW";

    // Timestamp (spread over last 7 days)
    const daysBack = Math.floor(index / 7);
    const txDate = new Date(today);
    txDate.setDate(today.getDate() - daysBack);
    txDate.setHours(raw.hour, raw.min, 0, 0);

    const reasons = buildExplanation({ ...raw, amountMultiplier, user });
    const recommendation = buildRecommendation(riskScore, reasons);

    return {
      caseId:          generateCaseId(index),
      txId:            `TX${String(100000 + index * 37).slice(0, 9)}`,
      user,
      amount:          raw.amount,
      amountFormatted: `₹${raw.amount.toLocaleString("en-IN")}`,
      avgAmount:       user.avgTx,
      avgFormatted:    `₹${user.avgTx.toLocaleString("en-IN")}`,
      amountMultiplier,
      timestamp:       txDate.toISOString(),
      timeFormatted:   formatTime(raw.hour, raw.min),
      dateFormatted:   txDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      txCity:          raw.txCity,
      locationMismatch: raw.txCity !== user.city,
      newDevice:       raw.newDevice,
      ipChanged:       raw.ipChanged,
      nightActivity:   raw.nightActivity,
      rapidSequence:   raw.rapidSequence,
      device:          raw.newDevice ? randomFrom(DEVICES) + " (New)" : randomFrom(DEVICES),
      bank:            randomFrom(BANKS),
      category:        randomFrom(CATEGORIES),
      merchantId:      `MID${Math.floor(Math.random() * 90000 + 10000)}`,
      scenario:        raw.scenario,
      status:          raw.status,
      riskScore,
      riskLevel,
      reasons,
      recommendation,
      // Agent outputs
      agents: {
        anomaly:  { score: parseFloat((riskScore * 0.9 + Math.random() * 0.05).toFixed(2)), triggered: amountMultiplier > 3 || raw.rapidSequence },
        context:  { locationOk: !raw.locationMismatch, deviceOk: !raw.newDevice, timeOk: !raw.nightActivity },
        risk:     { score: riskScore, level: riskLevel },
        decision: recommendation,
        explanation: reasons.join(". ") + ".",
      },
      auditLog: raw.status === "Closed" ? [{
        action: recommendation.action === "APPROVE" || riskScore < 0.3 ? "APPROVED" : "BLOCKED",
        by: "Analyst",
        reason: recommendation.reason,
        timestamp: new Date(txDate.getTime() + 1000 * 60 * 30).toISOString(),
        confidence: riskScore,
      }] : [],
    };
  });
}

const TRANSACTIONS = buildTransactions();

// Export for use in other modules
window.FraudData = {
  TRANSACTIONS,
  USERS,
  FRAUD_SCENARIOS,
};