import "./globals.css"

import { Geist_Mono, Inter } from "next/font/google"
import { headers } from "next/headers"
import { cookieToInitialState } from "wagmi"

import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getWagmiConfig } from "@/lib/wagmi-config"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialState = cookieToInitialState(
    getWagmiConfig(),
    (await headers()).get("cookie")
  )

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <Providers initialState={initialState}>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
