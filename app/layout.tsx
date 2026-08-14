import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rouletteroutes.nl'),
  title: "Roulette Routes Roamers | Dwalen met bedoeling",
  description: "Samen wandelen op willekeurige routes. Geen vast plan, wel goede gesprekken.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Roulette Routes Roamers",
    description: "Dwalen met bedoeling. Samen wandelen, verhalen delen.",
    type: "website",
    images: [{ url: '/logo.png', width: 187, height: 189, alt: 'Roulette Routes Roamers' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${playfair.variable} ${lato.variable}`}>
      <body className="min-h-screen flex flex-col">
        {isStaging && (
          <div className="w-full text-center text-xs font-bold py-1.5 px-4" style={{ background: '#7C3AED', color: 'white', letterSpacing: '0.05em' }}>
            STAGING OMGEVING - geen echte data
          </div>
        )}
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
