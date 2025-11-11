"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">المحادثات</h1>
        <p className="text-muted-foreground mt-2">تتبع محادثات المرضى مع البوت</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المحادثات الأخيرة</CardTitle>
          <CardDescription>
            جميع المحادثات مع نظام الحجز الذكي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">لا توجد محادثات حالياً</h3>
            <p className="text-sm text-muted-foreground mt-2">
              ستظهر المحادثات هنا عندما يتواصل المرضى مع البوت
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">محادثات نشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">0</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي المحادثات</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">0</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
