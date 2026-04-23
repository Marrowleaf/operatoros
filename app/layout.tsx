import './globals.css'

export const metadata = {
  title: 'OperatorOS',
  description: 'AI-run landing page delivery with quotes, approvals, payments, and replay built in.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
