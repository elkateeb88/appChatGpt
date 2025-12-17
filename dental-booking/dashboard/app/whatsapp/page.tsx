"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, CheckCircle, XCircle, RefreshCw, Settings, Webhook } from "lucide-react";

interface WhatsAppStatus {
  status: string;
  apiType: string;
  phoneNumberId: string;
  configured: boolean;
}

export default function WhatsAppPage() {
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check WhatsApp Business API status
    const checkStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3002/status");
        const data = await response.json();

        setWhatsappStatus(data);
        setError(null);
      } catch (error) {
        console.error("Error checking WhatsApp status:", error);
        setError("Unable to connect to WhatsApp Gateway");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">إعدادات WhatsApp Business API</h1>
        <p className="text-muted-foreground mt-2">إدارة اتصال WhatsApp Business Cloud API</p>
      </div>

      {/* Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-6 w-6" />
            حالة الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-4 py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">جاري التحقق من الحالة...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-4 py-4">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">حالة الخدمة:</span>
                <Badge variant={whatsappStatus?.status === "running" ? "default" : "destructive"} className="flex items-center gap-2">
                  {whatsappStatus?.status === "running" ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      قيد التشغيل
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      متوقف
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">نوع الـ API:</span>
                <Badge variant="outline">{whatsappStatus?.apiType}</Badge>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">حالة الإعداد:</span>
                <Badge variant={whatsappStatus?.configured ? "default" : "destructive"} className="flex items-center gap-2">
                  {whatsappStatus?.configured ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      مُعد بنجاح
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      يحتاج إعداد
                    </>
                  )}
                </Badge>
              </div>

              {whatsappStatus?.phoneNumberId && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Phone Number ID:</span>
                  <code className="px-2 py-1 bg-muted rounded text-sm">{whatsappStatus.phoneNumberId}</code>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Status */}
      {!whatsappStatus?.configured && !loading && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Settings className="h-6 w-6" />
              مطلوب: إكمال الإعداد
            </CardTitle>
            <CardDescription>
              يجب إعداد متغيرات البيئة التالية في ملف .env
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <div className="space-y-2">
                  <div>WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id</div>
                  <div>WHATSAPP_ACCESS_TOKEN=your_access_token</div>
                  <div>WEBHOOK_VERIFY_TOKEN=your_verify_token</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                بعد تعديل الإعدادات، قم بإعادة تشغيل خدمة WhatsApp Gateway
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            إعداد Webhook في Meta
          </CardTitle>
          <CardDescription>
            اتبع هذه الخطوات لربط WhatsApp Business API مع النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">1. إعداد WhatsApp Business App</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>اذهب إلى <a href="https://developers.facebook.com/" target="_blank" className="text-primary hover:underline">Meta for Developers</a></li>
              <li>قم بإنشاء أو اختيار تطبيق موجود</li>
              <li>أضف منتج "WhatsApp Business Platform"</li>
              <li>احصل على Phone Number ID و Access Token</li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">2. تكوين Webhook</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Callback URL:</p>
                <code className="block px-3 py-2 bg-muted rounded text-sm">
                  https://your-domain.com/webhook
                </code>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Verify Token:</p>
                <code className="block px-3 py-2 bg-muted rounded text-sm">
                  [استخدم نفس القيمة من WEBHOOK_VERIFY_TOKEN]
                </code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  • تأكد من الاشتراك في حقل "messages" في Webhook<br />
                  • استخدم ngrok للتطوير المحلي إذا لزم الأمر
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">3. اختبار الإعداد</h3>
            <p className="text-sm text-muted-foreground mb-2">
              بعد إكمال الإعداد، أرسل رسالة تجريبية إلى رقم WhatsApp Business الخاص بك:
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                "مرحبا" أو "السلام عليكم"
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              إذا كان الإعداد صحيحاً، سيرد البوت تلقائياً ويبدأ عملية الحجز.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>كيف يعمل النظام؟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">تدفق الرسائل:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>المريض يرسل رسالة WhatsApp إلى رقم Business الخاص بك</li>
              <li>Meta يرسل الرسالة إلى Webhook الخاص بك</li>
              <li>WhatsApp Gateway يستقبل الرسالة ويرسلها إلى Backend</li>
              <li>Backend (AI Agent) يعالج الرسالة ويولد الرد</li>
              <li>Gateway يرسل الرد عبر WhatsApp Business API</li>
              <li>المريض يستقبل الرد على WhatsApp</li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">المميزات:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>✓ لا يحتاج إلى مسح QR Code (Cloud API)</li>
              <li>✓ يعمل 24/7 بدون الحاجة لهاتف متصل</li>
              <li>✓ دعم متعدد اللغات (عربي وإنجليزي)</li>
              <li>✓ حفظ تلقائي للمحادثات والحجوزات</li>
              <li>✓ معالجة ذكية باستخدام GPT-4o-mini</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">الصفحات ذات الصلة:</h3>
            <div className="flex gap-2">
              <a href="/conversations" className="text-sm text-primary hover:underline">
                المحادثات
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/bookings" className="text-sm text-primary hover:underline">
                الحجوزات
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/services" className="text-sm text-primary hover:underline">
                الخدمات
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
