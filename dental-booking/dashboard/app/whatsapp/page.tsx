"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function WhatsAppPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    // Check WhatsApp status
    const checkStatus = async () => {
      try {
        const response = await fetch("http://localhost:8001/whatsapp/status");
        const data = await response.json();

        setIsConnected(data.connected || false);
        setStatus(data.status || "disconnected");

        if (data.qr) {
          setQrCode(data.qr);
        }
      } catch (error) {
        console.error("Error checking WhatsApp status:", error);
        setStatus("error");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    try {
      setStatus("reconnecting");
      await fetch("http://localhost:8001/whatsapp/reconnect", { method: "POST" });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Error reconnecting:", error);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">إعداد WhatsApp</h1>
        <p className="text-muted-foreground mt-2">قم بربط حساب WhatsApp مع النظام</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">حالة الاتصال:</span>
        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle className="h-4 w-4" />
              متصل
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              غير متصل
            </>
          )}
        </Badge>
        {!isConnected && (
          <button
            onClick={handleReconnect}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة الاتصال
          </button>
        )}
      </div>

      {/* QR Code Section */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              مسح رمز QR
            </CardTitle>
            <CardDescription>
              افتح WhatsApp على هاتفك {'>'} الإعدادات {'>'} الأجهزة المرتبطة {'>'} ربط جهاز
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {status === "checking" || status === "reconnecting" ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">جاري الاتصال...</p>
              </div>
            ) : qrCode ? (
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">
                  لا يوجد رمز QR متاح. الرجاء الضغط على "إعادة الاتصال"
                </p>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg text-sm space-y-2 w-full max-w-md">
              <p className="font-semibold">خطوات الربط:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>افتح تطبيق WhatsApp على هاتفك</li>
                <li>اذهب إلى الإعدادات (Settings)</li>
                <li>اختر "الأجهزة المرتبطة" (Linked Devices)</li>
                <li>اضغط على "ربط جهاز" (Link a Device)</li>
                <li>امسح رمز QR الظاهر أعلاه</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Info */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              تم الاتصال بنجاح
            </CardTitle>
            <CardDescription>
              حساب WhatsApp متصل ويعمل بشكل صحيح
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ النظام جاهز لاستقبال وإرسال الرسائل
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold mb-2">اختبر النظام:</p>
                <p className="text-sm text-muted-foreground">
                  أرسل رسالة "مرحبا" أو "السلام عليكم" إلى رقم WhatsApp المربوط لبدء محادثة حجز موعد.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">كيف يعمل النظام؟</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>المرضى يرسلون رسالة WhatsApp لبدء عملية الحجز</li>
              <li>البوت يرد تلقائياً ويطلب المعلومات المطلوبة</li>
              <li>يتم حفظ الحجوزات في قاعدة البيانات</li>
              <li>يمكنك متابعة المحادثات من صفحة "المحادثات"</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">ملاحظات مهمة:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>يجب أن يبقى هاتفك متصلاً بالإنترنت</li>
              <li>لا تقم بتسجيل الخروج من الأجهزة المرتبطة</li>
              <li>إذا انقطع الاتصال، ستحتاج لمسح QR من جديد</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
