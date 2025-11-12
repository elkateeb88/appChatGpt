"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default function BookingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">الحجوزات</h1>
        <p className="text-muted-foreground mt-2">إدارة مواعيد المرضى</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الحجوزات القادمة</CardTitle>
          <CardDescription>جميع المواعيد المجدولة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">لا توجد حجوزات حالياً</h3>
            <p className="text-sm text-muted-foreground mt-2">
              ستظهر الحجوزات هنا عندما يقوم المرضى بالحجز عبر البوت
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">0</span>
              <Badge variant="warning">معلق</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">مؤكدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">0</span>
              <Badge variant="success">مؤكد</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">مكتملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">0</span>
              <Badge variant="secondary">مكتمل</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
