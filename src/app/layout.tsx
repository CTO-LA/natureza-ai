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
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans flex flex-col min-h-screen`}>
        {/* Header */}
        <header className="bg-primary text-primary-foreground py-3 px-4 md:px-6 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-7 w-7" />
              <h1 className="text-xl md:text-2xl font-bold">Natureza AI</h1>
            </Link>
            <nav className="flex items-center gap-2 md:gap-4">
               <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80" asChild>
                 <Link href="/">
                   <MapPin className="h-4 w-4 mr-1 md:mr-2" />
                   <span className="hidden md:inline">Map</span>
                   <span className="md:hidden">Map</span>
                 </Link>
               </Button>
               {/* This button correctly links to the /report page */}
               <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80" asChild>
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
        <footer className="bg-muted text-muted-foreground py-3 px-4 md:px-6 mt-auto">
          <div className="container mx-auto text-center text-xs md:text-sm">
            &copy; {new Date().getFullYear()} Natureza AI. All rights reserved. | Mapping Resilience, Protecting Privacy
          </div>
        </footer>
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
