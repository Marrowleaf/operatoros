export async function POST(request: Request) {
  const body = await request.json()
  const amount = Number(body?.amount ?? 0)

  if (!Number.isFinite(amount) || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
  }

  return Response.json({
    checkoutUrl: `https://example.com/pay/test?amount=${amount}`,
    mode: 'stub',
  })
}
