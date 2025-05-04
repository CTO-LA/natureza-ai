import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Link from 'next/link';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { Button } from '@/components/ui/button';
import { MapPin, FileText } from 'lucide-react'; // Keep existing icons

export const metadata: Metadata = {
  title: 'Natureza AI Prototype',
  description: 'Mapping Resilience, Protecting Privacy',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Add dark class to html tag */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans flex flex-col min-h-screen bg-background text-foreground`}>
        {/* Header */}
        <header className="bg-card text-card-foreground border-b border-border py-3 px-4 md:px-6 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90">
              {/* Replace star SVG with Natureza AI logo placeholder SVG */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-7 w-7 text-primary">
                 <defs>
                   <linearGradient id="naturezaLeafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                     <stop offset="100%" style={{ stopColor: 'hsl(120, 50%, 55%)', stopOpacity: 1 }} /> {/* Lighter green */}
                   </linearGradient>
                   <linearGradient id="naturezaWaterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'hsl(190, 70%, 60%)', stopOpacity: 1 }} /> {/* Lighter teal/cyan */}
                   </linearGradient>
                 </defs>
                 {/* Simplified representation based on logo description */}
                 <path d="M50 10 C 70 30, 70 70, 50 90 C 30 70, 30 30, 50 10 Z" fill="url(#naturezaLeafGradient)" transform="rotate(45 50 50)" />
                 <path d="M50 15 Q 60 45, 50 65 Q 40 45, 50 15 Z" fill="url(#naturezaWaterGradient)" transform="translate(0, 10) rotate(-15 50 50)" opacity="0.8"/>
                 <circle cx="50" cy="50" r="5" fill="hsl(var(--primary-foreground))" opacity="0.9"/>
               </svg>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Natureza AI</h1>
            </Link>
            <nav className="flex items-center gap-2 md:gap-4">
               <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground" asChild>
                 <Link href="/">
                   <MapPin className="h-4 w-4 mr-1 md:mr-2" />
                   <span className="hidden md:inline">Map</span>
                   <span className="md:hidden">Map</span>
                 </Link>
               </Button>
               <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground" asChild>
                 <Link href="/report">
                   <FileText className="h-4 w-4 mr-1 md:mr-2" />
                   <span className="hidden md:inline">Report Incident</span>
                   <span className="md:hidden">Report</span>
                 </Link>
               </Button>
             </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-0 py-0 md:px-4 md:py-4 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-card text-muted-foreground border-t border-border py-3 px-4 md:px-6 mt-auto">
          <div className="container mx-auto text-center text-xs md:text-sm">
            &copy; {new Date().getFullYear()} Natureza AI. All rights reserved. | Mapping Resilience, Protecting Privacy
          </div>
        </footer>
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
