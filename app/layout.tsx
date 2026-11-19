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

/* Applies the light/dark choice before the page paints: the visitor's saved
   choice, otherwise their device setting. */
const themeScript = `(function(){var r=document.documentElement;r.classList.add('js');var t=null;try{t=localStorage.getItem('npc-theme')}catch(e){}if(t!=='dark'&&t!=='light'){t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}r.setAttribute('data-theme',t);})();`;

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
