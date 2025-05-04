import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Link from 'next/link';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { Button } from '@/components/ui/button';
import { Leaf, MapPin, FileText } from 'lucide-react';

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
              {/* Consider replacing Leaf with a more abstract/techy icon or SVG logo if available */}
              {/* <Leaf className="h-7 w-7 text-primary" /> */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary">
                 <path d="M12 2l3.09 6.32L22 9.27l-5 4.87L18.18 22 12 18.34 5.82 22 7 14.14l-5-4.87 6.91-1.05L12 2z"></path> {/* Example Star Icon */}
                 <line x1="12" y1="8" x2="12" y2="14"></line>
                 <line x1="9" y1="11" x2="15" y2="11"></line>
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
