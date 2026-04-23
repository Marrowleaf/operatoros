function scoreComplexity(offerSummary, targetAudience, primaryGoal) {
  const text = `${offerSummary} ${targetAudience} ${primaryGoal}`.toLowerCase();
  let score = 0;
  if (text.includes('redesign') || text.includes('improve')) score += 1;
  if (text.includes('saas') || text.includes('startup')) score += 2;
  if (text.includes('conversion') || text.includes('lead')) score += 1;
  if (text.includes('multi') || text.includes('dashboard') || text.includes('app')) score += 3;
  return score;
}

function generateQuote({ offerSummary, targetAudience, primaryGoal, packageHint }) {
  const hinted = (packageHint || '').toLowerCase();

  if (hinted.includes('refresh')) {
    return { status: 'ok', packageType: 'Refresh', price: 79, reason: 'Existing-page refresh request matched Refresh package.' };
  }

  const complexity = scoreComplexity(offerSummary, targetAudience, primaryGoal);

  if (complexity >= 4) {
    return { status: 'ok', packageType: 'Pro', price: 249, reason: 'Brief needs stronger positioning and a more custom structure.' };
  }
  if (complexity >= 2) {
    return { status: 'ok', packageType: 'Starter', price: 149, reason: 'Brief fits a custom one-page launch scope within Starter limits.' };
  }
  if ((offerSummary || '').trim().length < 8) {
    return { status: 'escalate', reason: 'Brief is too thin to quote safely.' };
  }
  return { status: 'ok', packageType: 'Starter', price: 99, reason: 'Brief fits a straightforward one-page launch page.' };
}

window.OperatorOSDemo = { generateQuote };
