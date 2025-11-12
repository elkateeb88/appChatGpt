"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MessageSquare, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardHome() {
  const [services, setServices] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<string>("checking");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check health
        const health = await api.healthCheck();
        setHealthStatus(health.status);

        // Get services
        const servicesData = await api.getServices();
        setServices(servicesData.services);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Error fetching data:", error);
        setHealthStatus("error");

        // Auto-retry up to 3 times with 2 second delay
        if (retryCount < 3) {
          console.log(`Retrying... (${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      }
    };

    fetchData();
  }, [retryCount]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">نظام حجز المواعيد للعيادة</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-sm">حالة النظام:</span>
        <Badge variant={healthStatus === "healthy" ? "success" : "destructive"}>
          {healthStatus === "healthy" ? "نشط" : healthStatus === "checking" ? "جاري التحقق..." : "خطأ"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المرضى</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">مريض جديد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المحادثات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">محادثة نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">حجوزات مؤكدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Overview */}
      <Card>
        <CardHeader>
          <CardTitle>الخدمات المتاحة</CardTitle>
          <CardDescription>
            {services.length} خدمة متاحة حالياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-base">{service.name_ar}</CardTitle>
                  <CardDescription>{service.description_ar}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{service.price}₪</p>
                      <p className="text-xs text-muted-foreground">
                        {service.duration_minutes} دقيقة
                      </p>
                    </div>
                    <Badge variant={service.is_active ? "success" : "secondary"}>
                      {service.is_active ? "نشط" : "متوقف"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>البدء السريع</CardTitle>
          <CardDescription>اختبر النظام باستخدام API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono">POST /webhook/message</p>
            <p className="text-xs text-muted-foreground mt-1">
              أرسل رسالة للبوت لاختبار الحجز
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-2">رابط API Documentation:</p>
            <a
              href="http://localhost:8001/docs"
              target="_blank"
              className="text-primary hover:underline"
            >
              http://localhost:8001/docs
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
