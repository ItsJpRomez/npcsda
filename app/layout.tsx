import type { Metadata, Viewport } from 'next';
import { Lora, Plus_Jakarta_Sans } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-lora', display: 'swap',
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap',
});

export const metadata: Metadata = {
  title: 'NPC Seventh-day Adventist Church · Quezon City',
  icons: { icon: '/assets/logo.jpg' },
};

export const viewport: Viewport = { themeColor: '#ffffff' };

/* Applies the saved light/dark choice before the page paints (default: light). */
const themeScript = `(function(){var r=document.documentElement;r.classList.add('js');var t=null;try{t=localStorage.getItem('npc-theme')}catch(e){}r.setAttribute('data-theme',t==='dark'?'dark':'light');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${lora.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
