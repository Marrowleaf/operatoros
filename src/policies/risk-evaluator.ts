export function evaluateRisk(actionType: string, payload?: Record<string, unknown>) {
  if (actionType === 'refund' && Number(payload?.amount ?? 0) > 25) {
    return { allowed: false, requiresApproval: true, reason: 'Refund exceeds automatic threshold.' }
  }

  if (actionType === 'quote_override') {
    return { allowed: false, requiresApproval: true, reason: 'Quote overrides are approval-gated.' }
  }

  if (actionType === 'outbound_message' && Number(payload?.dailyCount ?? 0) >= 20) {
    return { allowed: false, requiresApproval: true, reason: 'Daily outbound messaging limit reached.' }
  }

  return { allowed: true, requiresApproval: false, reason: null }
}
