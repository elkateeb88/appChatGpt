"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Phone, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Booking {
  id: string;
  patient_name: string;
  patient_phone: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  services?: {
    name_ar: string;
    name_en: string;
    price: number;
  };
  doctors?: {
    name: string;
    clinic_name: string;
  };
}

interface BookingStats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filterStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterStatus !== "all" ? { status: filterStatus } : {};
      const response: any = await api.getBookings(params);
      setBookings(response.bookings || []);
    } catch (err) {
      setError("فشل في تحميل الحجوزات");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response: any = await api.getBookingStats();
      setStats(response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      await fetchBookings();
      await fetchStats();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("فشل في تحديث الحالة");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "معلق", variant: "outline" },
      confirmed: { label: "مؤكد", variant: "default" },
      completed: { label: "مكتمل", variant: "secondary" },
      cancelled: { label: "ملغي", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">الحجوزات</h1>
        <p className="text-muted-foreground mt-2">إدارة مواعيد المرضى</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilterStatus("pending")}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              قيد الانتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.pending}</span>
              <Badge variant="outline">معلق</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilterStatus("confirmed")}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              مؤكدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.confirmed}</span>
              <Badge variant="default">مؤكد</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilterStatus("completed")}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              مكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.completed}</span>
              <Badge variant="secondary">مكتمل</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilterStatus("cancelled")}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              ملغية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.cancelled}</span>
              <Badge variant="destructive">ملغي</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => setFilterStatus("all")}
        >
          الكل ({stats.total})
        </Button>
        <Button
          variant={filterStatus === "pending" ? "default" : "outline"}
          onClick={() => setFilterStatus("pending")}
        >
          معلق ({stats.pending})
        </Button>
        <Button
          variant={filterStatus === "confirmed" ? "default" : "outline"}
          onClick={() => setFilterStatus("confirmed")}
        >
          مؤكد ({stats.confirmed})
        </Button>
        <Button
          variant={filterStatus === "completed" ? "default" : "outline"}
          onClick={() => setFilterStatus("completed")}
        >
          مكتمل ({stats.completed})
        </Button>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === "all" ? "جميع الحجوزات" : `الحجوزات - ${filterStatus}`}
          </CardTitle>
          <CardDescription>
            إجمالي {bookings.length} حجز
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">جاري التحميل...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا توجد حجوزات</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {filterStatus === "all"
                  ? "ستظهر الحجوزات هنا عندما يقوم المرضى بالحجز عبر البوت"
                  : `لا توجد حجوزات ${filterStatus}`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Right Side - Patient Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{booking.patient_name}</span>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{booking.patient_phone}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(booking.date)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.time}</span>
                        </div>

                        {booking.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">{booking.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Left Side - Service & Actions */}
                      <div className="space-y-3">
                        {booking.services && (
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="font-semibold">{booking.services.name_ar}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {booking.services.name_en}
                            </div>
                            {booking.services.price && (
                              <div className="text-sm font-semibold mt-2">
                                {booking.services.price} ₪
                              </div>
                            )}
                          </div>
                        )}

                        {booking.doctors && (
                          <div className="text-sm">
                            <div className="font-medium">د. {booking.doctors.name}</div>
                            <div className="text-muted-foreground">{booking.doctors.clinic_name}</div>
                          </div>
                        )}

                        {/* Status Actions */}
                        <div className="flex flex-wrap gap-2">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateStatus(booking.id, "confirmed")}
                              >
                                تأكيد
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus(booking.id, "cancelled")}
                              >
                                إلغاء
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateStatus(booking.id, "completed")}
                              >
                                إتمام
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(booking.id, "cancelled")}
                              >
                                إلغاء
                              </Button>
                            </>
                          )}
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
