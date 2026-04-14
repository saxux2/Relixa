import './globals.css'

export const metadata = {
  title: 'Relifo',
  description: 'Blockchain-Based Disaster Relief System',
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
