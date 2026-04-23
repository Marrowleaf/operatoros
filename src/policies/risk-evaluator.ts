export function evaluateRisk(actionType: string, payload?: Record<string, unknown>) {
  if (actionType === 'refund' && Number(payload?.amount ?? 0) > 25) {
    return { allowed: false, requiresApproval: true, reason: 'Refund exceeds automatic threshold.' }
  }

  if (actionType === 'quote_override') {
    return { allowed: false, requiresApproval: true, reason: 'Quote overrides are approval-gated.' }
  }

  if (actionType === 'deliver_project') {
    const price = Number(payload?.quotedPrice ?? 0)
    const packageType = String(payload?.packageType ?? '')

    if (price >= 200 || packageType === 'pro') {
      return {
        allowed: false,
        requiresApproval: true,
        reason: 'High-value or Pro deliveries require explicit approval before release.',
      }
    }
  }

  if (actionType === 'outbound_message' && Number(payload?.dailyCount ?? 0) >= 20) {
    return { allowed: false, requiresApproval: true, reason: 'Daily outbound messaging limit reached.' }
  }

  return { allowed: true, requiresApproval: false, reason: null }
}
