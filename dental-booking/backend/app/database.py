"""
Database operations using Supabase.
"""
from supabase import create_client, Client
from app.config import settings
from typing import Optional, Dict, List, Any
from datetime import datetime, date, time as datetime_time
import json


class Database:
    """Supabase database client wrapper."""

    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )

    # ==================== Doctors ====================

    def get_doctors(self, is_active: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Get all doctors, optionally filtered by active status."""
        query = self.client.table("doctors").select("*")

        if is_active is not None:
            query = query.eq("is_active", is_active)

        response = query.execute()
        return response.data

    def get_doctor(self, doctor_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific doctor by ID."""
        response = self.client.table("doctors")\
            .select("*")\
            .eq("id", doctor_id)\
            .execute()
        return response.data[0] if response.data else None

    # ==================== Services ====================

    def get_active_services(self) -> List[Dict[str, Any]]:
        """Get all active services with doctor information."""
        response = self.client.table("services")\
            .select("*, doctors(name, clinic_name)")\
            .eq("is_active", True)\
            .execute()
        return response.data

    # ==================== Available Slots ====================

    def get_available_slots(
        self,
        target_date: str,
        doctor_id: Optional[str] = None,
        service_id: Optional[str] = None
    ) -> List[str]:
        """
        Get available time slots for a given date, optionally filtered by doctor.
        Returns list of available times based on doctor availability.

        Args:
            target_date: Date in YYYY-MM-DD format
            doctor_id: Optional doctor ID to filter by
            service_id: Optional service ID (to get doctor from service)
        """
        # If service_id provided, get the doctor_id from service
        if service_id and not doctor_id:
            service_response = self.client.table("services")\
                .select("doctor_id")\
                .eq("id", service_id)\
                .execute()
            if service_response.data:
                doctor_id = service_response.data[0].get("doctor_id")

        # Get doctor availability for the day of week
        all_slots = []
        if doctor_id:
            # Parse target_date to get day of week (0 = Monday, 6 = Sunday)
            target_datetime = datetime.fromisoformat(target_date)
            day_of_week = target_datetime.weekday()  # 0 = Monday

            # Get doctor's availability for this day
            availability_response = self.client.table("doctor_availability")\
                .select("*")\
                .eq("doctor_id", doctor_id)\
                .eq("day_of_week", day_of_week)\
                .eq("is_available", True)\
                .execute()

            if availability_response.data:
                # Generate slots from doctor's availability
                for slot in availability_response.data:
                    start_time = slot["start_time"]  # e.g., "09:00:00"
                    end_time = slot["end_time"]      # e.g., "17:00:00"

                    # Parse times
                    start_hour, start_min = map(int, start_time.split(":")[:2])
                    end_hour, end_min = map(int, end_time.split(":")[:2])

                    # Generate 30-minute intervals
                    current = datetime_time(start_hour, start_min)
                    end = datetime_time(end_hour, end_min)

                    while current < end:
                        all_slots.append(current.strftime("%H:%M"))
                        # Add 30 minutes
                        minutes = current.hour * 60 + current.minute + 30
                        current = datetime_time(minutes // 60, minutes % 60)
            else:
                # No availability found, use default slots
                all_slots = self._get_default_slots()
        else:
            # No doctor specified, use default slots
            all_slots = self._get_default_slots()

        # Get booked slots for this date (and doctor if specified)
        booking_query = self.client.table("bookings")\
            .select("time")\
            .eq("date", target_date)\
            .in_("status", ["pending", "confirmed"])

        if doctor_id:
            booking_query = booking_query.eq("doctor_id", doctor_id)

        response = booking_query.execute()

        # Remove booked slots
        booked_times = [booking["time"] for booking in response.data]
        available = [slot for slot in all_slots if slot not in booked_times]

        return available

    def _get_default_slots(self) -> List[str]:
        """Get default time slots (9 AM to 5 PM, 30-min intervals)."""
        return [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
            "15:00", "15:30", "16:00", "16:30", "17:00"
        ]

    # ==================== Doctor Availability ====================

    def get_doctor_availability(self, doctor_id: str) -> List[Dict[str, Any]]:
        """Get all availability schedules for a doctor."""
        response = self.client.table("doctor_availability")\
            .select("*")\
            .eq("doctor_id", doctor_id)\
            .order("day_of_week")\
            .order("start_time")\
            .execute()
        return response.data

    def update_doctor_availability(
        self,
        doctor_id: str,
        availability_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Update doctor availability schedule.
        Deletes existing and inserts new availability.

        Args:
            doctor_id: Doctor UUID
            availability_data: List of availability objects with day_of_week, start_time, end_time
        """
        # Delete existing availability for this doctor
        self.client.table("doctor_availability")\
            .delete()\
            .eq("doctor_id", doctor_id)\
            .execute()

        # Insert new availability
        if availability_data:
            for item in availability_data:
                item["doctor_id"] = doctor_id
                if "is_available" not in item:
                    item["is_available"] = True

            response = self.client.table("doctor_availability")\
                .insert(availability_data)\
                .execute()
            return response.data

        return []

    # ==================== Patients ====================

    def get_or_create_patient(self, phone: str, name: Optional[str] = None, language: str = "ar") -> Dict[str, Any]:
        """Get existing patient or create new one."""
        # Try to find existing patient
        response = self.client.table("patients")\
            .select("*")\
            .eq("phone", phone)\
            .execute()

        if response.data:
            patient = response.data[0]
            # Update name if provided and different
            if name and patient.get("name") != name:
                update_response = self.client.table("patients")\
                    .update({"name": name})\
                    .eq("id", patient["id"])\
                    .execute()
                return update_response.data[0]
            return patient

        # Create new patient
        patient_data = {
            "phone": phone,
            "name": name or "مريض جديد",
            "language": language
        }
        response = self.client.table("patients")\
            .insert(patient_data)\
            .execute()
        return response.data[0]

    # ==================== Conversations ====================

    def get_all_conversations(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all conversations, ordered by most recent."""
        response = self.client.table("conversations")\
            .select("*")\
            .order("updated_at", desc=True)\
            .limit(limit)\
            .execute()
        return response.data

    def get_conversation(self, patient_phone: str) -> Optional[Dict[str, Any]]:
        """Get existing conversation for a patient."""
        response = self.client.table("conversations")\
            .select("*")\
            .eq("patient_phone", patient_phone)\
            .execute()
        return response.data[0] if response.data else None

    def create_or_update_conversation(
        self,
        patient_phone: str,
        patient_id: Optional[str] = None,
        language: str = "ar",
        collected_data: Optional[Dict] = None,
        messages: Optional[List] = None
    ) -> Dict[str, Any]:
        """Create or update conversation state."""
        existing = self.get_conversation(patient_phone)

        data = {
            "patient_phone": patient_phone,
            "language": language,
            "updated_at": datetime.now().isoformat()
        }

        if patient_id:
            data["patient_id"] = patient_id

        if collected_data is not None:
            # Merge with existing data if updating
            if existing:
                current_data = existing.get("collected_data", {})
                current_data.update(collected_data)
                data["collected_data"] = current_data
            else:
                data["collected_data"] = collected_data

        if messages is not None:
            # Append to existing messages if updating
            if existing:
                current_messages = existing.get("messages", [])
                current_messages.extend(messages)
                data["messages"] = current_messages
            else:
                data["messages"] = messages

        if existing:
            # Update
            response = self.client.table("conversations")\
                .update(data)\
                .eq("patient_phone", patient_phone)\
                .execute()
        else:
            # Create
            response = self.client.table("conversations")\
                .insert(data)\
                .execute()

        return response.data[0]

    # ==================== Bookings ====================

    def get_bookings(
        self,
        status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        doctor_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get bookings with optional filters.

        Args:
            status: Filter by status (pending, confirmed, completed, cancelled)
            date_from: Filter bookings from this date (YYYY-MM-DD)
            date_to: Filter bookings until this date (YYYY-MM-DD)
            doctor_id: Filter by doctor ID
            limit: Maximum number of results
        """
        query = self.client.table("bookings")\
            .select("*, services(name_ar, name_en, price), doctors(name, clinic_name), patients(name, phone)")

        if status:
            query = query.eq("status", status)

        if date_from:
            query = query.gte("date", date_from)

        if date_to:
            query = query.lte("date", date_to)

        if doctor_id:
            query = query.eq("doctor_id", doctor_id)

        response = query.order("date", desc=False)\
            .order("time", desc=False)\
            .limit(limit)\
            .execute()

        return response.data

    def get_booking_stats(self) -> Dict[str, int]:
        """Get booking statistics (counts by status)."""
        stats = {
            "pending": 0,
            "confirmed": 0,
            "completed": 0,
            "cancelled": 0,
            "total": 0
        }

        # Get all bookings grouped by status
        response = self.client.table("bookings")\
            .select("status")\
            .execute()

        for booking in response.data:
            status = booking.get("status", "pending")
            if status in stats:
                stats[status] += 1
            stats["total"] += 1

        return stats

    def update_booking_status(
        self,
        booking_id: str,
        status: str
    ) -> Dict[str, Any]:
        """Update booking status."""
        if status not in ["pending", "confirmed", "completed", "cancelled"]:
            raise ValueError(f"Invalid status: {status}")

        response = self.client.table("bookings")\
            .update({"status": status})\
            .eq("id", booking_id)\
            .execute()

        if not response.data:
            raise ValueError("Booking not found")

        return response.data[0]

    def create_booking(
        self,
        patient_phone: str,
        patient_name: str,
        service_id: str,
        date: str,
        time: str,
        notes: Optional[str] = None,
        language: str = "ar",
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new booking."""
        # Get or create patient
        patient = self.get_or_create_patient(patient_phone, patient_name, language)

        # Get service to find doctor
        service_response = self.client.table("services")\
            .select("doctor_id")\
            .eq("id", service_id)\
            .execute()

        if not service_response.data:
            raise ValueError("Service not found")

        doctor_id = service_response.data[0]["doctor_id"]

        # Create booking
        booking_data = {
            "patient_id": patient["id"],
            "patient_name": patient_name,
            "patient_phone": patient_phone,
            "doctor_id": doctor_id,
            "service_id": service_id,
            "date": date,
            "time": time,
            "notes": notes,
            "language": language,
            "status": "pending",
            "conversation_id": conversation_id
        }

        response = self.client.table("bookings")\
            .insert(booking_data)\
            .execute()

        return response.data[0]


# Global database instance
db = Database()
