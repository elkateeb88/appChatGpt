"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data: any = await api.getServices();
        setServices(data.services);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">الخدمات</h1>
        <p className="text-muted-foreground mt-2">إدارة خدمات العيادة</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{service.name_ar}</CardTitle>
                  <CardDescription className="mt-2">
                    {service.description_ar}
                  </CardDescription>
                </div>
                <Badge variant={service.is_active ? "success" : "secondary"}>
                  {service.is_active ? "نشط" : "متوقف"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">السعر:</span>
                  <span className="text-2xl font-bold text-primary">
                    {service.price}₪
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">المدة:</span>
                  <span className="font-medium">
                    {service.duration_minutes} دقيقة
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {service.name_en}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              لا توجد خدمات متاحة. تحقق من قاعدة البيانات.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
