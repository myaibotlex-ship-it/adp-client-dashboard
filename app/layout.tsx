import './globals.css'

export const metadata = {
  title: 'ADP Client Research - Calibrate HCM',
  description: 'Prospecting database for ADP clients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
