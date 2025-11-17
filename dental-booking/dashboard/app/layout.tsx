import type { Metadata } from "next";
// Disabled Google Fonts due to Docker build network issues
// import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Calendar, MessageSquare, Settings, Home, Smartphone, UserCircle } from "lucide-react";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dental Booking Dashboard - Gaza",
  description: "AI-powered dental appointment booking system for Gaza",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-card border-l border-border">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-primary">🦷 عيادة الأسنان</h1>
              <p className="text-sm text-muted-foreground mt-1">نظام الحجوزات</p>
            </div>

            <nav className="px-4 space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>الرئيسية</span>
              </Link>

              <Link
                href="/bookings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Calendar className="h-5 w-5" />
                <span>الحجوزات</span>
              </Link>

              <Link
                href="/conversations"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                <span>المحادثات</span>
              </Link>

              <Link
                href="/doctors"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <UserCircle className="h-5 w-5" />
                <span>الأطباء</span>
              </Link>

              <Link
                href="/services"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>الخدمات</span>
              </Link>

              <Link
                href="/whatsapp"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Smartphone className="h-5 w-5" />
                <span>WhatsApp</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-background">
            <div className="container mx-auto p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
