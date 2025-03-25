// app/layout.tsx
import type { Metadata } from 'next'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'

export const metadata: Metadata = {
  title: 'Discord Color Text Generator',
  description: 'Generate colored text for Discord',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}