import type { Metadata } from 'next';
import { Noto_Sans_Telugu, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const teluguFont = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-telugu',
});

const englishFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-english',
});

export const metadata: Metadata = {
  title: 'Writings by Naveen | కథలు • జ్ఞాపకాలు • రచనలు',
  description: 'తుమాటి నవీన్ కుమార్ (Naveen Tumati) తెలుగు కథలు, కవితలు మరియు రచనల వేదిక.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="te" className={`${teluguFont.variable} ${englishFont.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 antialiased selection:bg-pink-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}