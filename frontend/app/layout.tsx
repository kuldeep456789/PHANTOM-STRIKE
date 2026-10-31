import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Phantom Strike',
  description: 'A real-time multiplayer secret-action party game for 2–8 players.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05050f] text-white min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
