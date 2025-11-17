"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle, Clock, Save, X, Plus, XCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Doctor {
  id: string;
  name: string;
  phone: string;
  clinic_name: string;
  is_active: boolean;
}

interface Availability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS_MAP: Record<number, string> = {
  6: "الأحد",
  0: "الاثنين",
  1: "الثلاثاء",
  2: "الأربعاء",
  3: "الخميس",
  4: "الجمعة",
  5: "السبت",
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailability(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await api.getDoctors();
      console.log("Doctors response:", response);

      if (!response || !response.doctors) {
        throw new Error("Invalid response from server");
      }

      setDoctors(response.doctors || []);
      if (response.doctors?.length > 0) {
        setSelectedDoctor(response.doctors[0]);
      }
    } catch (err: any) {
      console.error("Error fetching doctors:", err);
      setError(err?.message || "فشل في تحميل بيانات الأطباء");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (doctorId: string) => {
    try {
      const response: any = await api.getDoctorAvailability(doctorId);
      console.log("Availability response:", response);
      setAvailability(response.availability || []);
      setEditMode(false);
    } catch (err: any) {
      console.error("Error fetching availability:", err);
      setAvailability([]);
    }
  };

  const handleSave = async () => {
    if (!selectedDoctor) return;

    setSaving(true);
    try {
      // Format data for API
      const formattedData = availability.map((item) => ({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        is_available: item.is_available,
      }));

      await api.updateDoctorAvailability(selectedDoctor.id, formattedData);
      await fetchAvailability(selectedDoctor.id);
      alert("تم حفظ المواعيد بنجاح");
    } catch (err) {
      console.error("Error saving availability:", err);
      alert("فشل في حفظ المواعيد");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = () => {
    setAvailability([
      ...availability,
      {
        day_of_week: 0,
        start_time: "09:00:00",
        end_time: "17:00:00",
        is_available: true,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">إدارة الأطباء</h1>
        <p className="text-muted-foreground mt-2">إدارة مواعيد الأطباء وأوقات الدوام</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse">جاري التحميل...</div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-red-600">حدث خطأ</h3>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <Button onClick={fetchDoctors} className="mt-4">
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Doctors List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>الأطباء</CardTitle>
              <CardDescription>{doctors.length} طبيب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDoctor?.id === doctor.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-semibold">{doctor.name}</div>
                      <div className="text-xs text-muted-foreground">{doctor.clinic_name}</div>
                    </div>
                    <Badge variant={doctor.is_active ? "default" : "secondary"}>
                      {doctor.is_active ? "نشط" : "متوقف"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Availability Schedule */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    مواعيد الدوام - {selectedDoctor?.name}
                  </CardTitle>
                  <CardDescription>إدارة أوقات عمل الطبيب خلال الأسبوع</CardDescription>
                </div>
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                        <X className="h-4 w-4 mr-1" />
                        إلغاء
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setEditMode(true)}>
                      تعديل المواعيد
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedDoctor ? (
                <div className="text-center py-12 text-muted-foreground">
                  اختر طبيباً لعرض مواعيده
                </div>
              ) : availability.length === 0 && !editMode ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">لا توجد مواعيد</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    لم يتم تحديد مواعيد دوام لهذا الطبيب
                  </p>
                  <Button onClick={() => setEditMode(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    إضافة مواعيد
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {availability.map((slot, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">اليوم</label>
                          {editMode ? (
                            <select
                              value={slot.day_of_week}
                              onChange={(e) =>
                                handleUpdateSlot(index, "day_of_week", parseInt(e.target.value))
                              }
                              className="w-full p-2 border rounded bg-background"
                            >
                              {Object.entries(DAYS_MAP).map(([day, label]) => (
                                <option key={day} value={day}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-2 font-medium">{DAYS_MAP[slot.day_of_week]}</div>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">من</label>
                          {editMode ? (
                            <input
                              type="time"
                              value={formatTime(slot.start_time)}
                              onChange={(e) =>
                                handleUpdateSlot(index, "start_time", e.target.value + ":00")
                              }
                              className="w-full p-2 border rounded bg-background"
                            />
                          ) : (
                            <div className="p-2">{formatTime(slot.start_time)}</div>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">إلى</label>
                          {editMode ? (
                            <input
                              type="time"
                              value={formatTime(slot.end_time)}
                              onChange={(e) =>
                                handleUpdateSlot(index, "end_time", e.target.value + ":00")
                              }
                              className="w-full p-2 border rounded bg-background"
                            />
                          ) : (
                            <div className="p-2">{formatTime(slot.end_time)}</div>
                          )}
                        </div>

                        <div className="flex items-end">
                          {editMode ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveSlot(index)}
                              className="w-full"
                            >
                              <X className="h-4 w-4 mr-1" />
                              حذف
                            </Button>
                          ) : (
                            <Badge variant={slot.is_available ? "default" : "secondary"}>
                              {slot.is_available ? "متاح" : "غير متاح"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {editMode && (
                    <Button variant="outline" onClick={handleAddSlot} className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      إضافة موعد جديد
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
