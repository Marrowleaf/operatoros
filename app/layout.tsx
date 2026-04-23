export const metadata = {
  title: 'OperatorOS',
  description: 'Control plane for AI-run internet businesses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#09090b' }}>
        {children}
      </body>
    </html>
  )
}
