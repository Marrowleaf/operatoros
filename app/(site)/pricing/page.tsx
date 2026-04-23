const packages = [
  {
    name: 'Refresh',
    price: '£79',
    bullets: ['Existing-page refresh', 'Copy tightening', '1 revision round'],
  },
  {
    name: 'Starter',
    price: '£99–149',
    bullets: ['One landing page', 'Core CTA flow', '1 revision round'],
  },
  {
    name: 'Pro',
    price: '£199–249',
    bullets: ['Custom landing page', 'Stronger copy pass', '2 revision rounds'],
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Simple packages. Clear scope.</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          OperatorOS Studio uses fixed pricing bands so the AI can quote safely and consistently.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.name} className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-2xl font-semibold">{pkg.name}</h2>
              <p className="mt-2 text-3xl text-cyan-300">{pkg.price}</p>
              <ul className="mt-6 grid gap-3 text-zinc-300">
                {pkg.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
