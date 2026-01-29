import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">
          صمم تصاميمك بالذكاء الاصطناعي
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          ارفع ملفات PSD الخاصة بك، واترك الذكاء الاصطناعي يولد تصاميم احترافية بناءً على طلبك
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/library"
            className="border border-primary text-primary px-8 py-4 rounded-lg text-lg hover:bg-primary/5 transition-colors"
          >
            استعرض المكتبة
          </Link>
          <Link
            href="/generate"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg hover:bg-primary/90 transition-colors"
          >
            ابدأ التصميم
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-4xl mb-4">📤</div>
            <h3 className="font-semibold text-lg mb-2">ارفع Templates</h3>
            <p className="text-muted-foreground">
              ارفع ملفات PSD الخاصة بك والنظام سيحلل الطبقات تلقائياً
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold text-lg mb-2">اطلب بالعربي</h3>
            <p className="text-muted-foreground">
              اكتب ما تريد بكلماتك والذكاء الاصطناعي سيفهم طلبك
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="font-semibold text-lg mb-2">احصل على تصميمك</h3>
            <p className="text-muted-foreground">
              في ثوانٍ ستحصل على تصميم جاهز للنشر بصيغة PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
