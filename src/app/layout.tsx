import './globals.css'
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"


import { AmbientBackground } from "@/components/ambient-background"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans")}>
      <body className={cn("antialiased font-sans flex flex-col min-h-screen")}>

          <AmbientBackground />
          <TooltipProvider>{children}</TooltipProvider>

      </body>
    </html>
  )
}
