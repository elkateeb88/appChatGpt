import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'AI Design Generator',
  description: 'AI-powered social media design generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background">
          <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    <span className="font-bold text-xl">AI Design Generator</span>
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/library"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    المكتبة
                  </a>
                  <a
                    href="/generate"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    إنشاء تصميم
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
