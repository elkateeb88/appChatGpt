"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Phone, Clock } from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  role: string;
  content: string;
}

interface Conversation {
  id: string;
  patient_phone: string;
  patient_id: string | null;
  language: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations(50);
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("فشل في تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getMessageCount = (messages: Message[]) => {
    return messages?.length || 0;
  };

  const getLastMessage = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "لا توجد رسائل";
    const lastMsg = messages[messages.length - 1];
    const content = lastMsg.content;
    return content.length > 100 ? content.substring(0, 100) + "..." : content;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">المحادثات</h1>
        <p className="text-muted-foreground mt-2">تتبع محادثات المرضى مع البوت</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي المحادثات</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{conversations.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي الرسائل</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {conversations.reduce((total, conv) => total + getMessageCount(conv.messages), 0)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">محادثات نشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{conversations.length}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المحادثات الأخيرة</CardTitle>
          <CardDescription>
            جميع المحادثات مع نظام الحجز الذكي
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-sm text-muted-foreground">جاري تحميل المحادثات...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={fetchConversations}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا توجد محادثات حالياً</h3>
              <p className="text-sm text-muted-foreground mt-2">
                ستظهر المحادثات هنا عندما يتواصل المرضى مع البوت
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Card key={conversation.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{conversation.patient_phone}</span>
                          <span className="text-xs text-muted-foreground">
                            ({conversation.language === 'ar' ? 'عربي' : 'English'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>{getMessageCount(conversation.messages)} رسالة</span>
                        </div>

                        <div className="text-sm bg-muted p-3 rounded-lg">
                          <p className="text-muted-foreground">آخر رسالة:</p>
                          <p className="mt-1">{getLastMessage(conversation.messages)}</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>آخر تحديث: {formatDate(conversation.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
