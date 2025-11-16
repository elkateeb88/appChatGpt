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

    # ==================== Services ====================

    def get_active_services(self) -> List[Dict[str, Any]]:
        """Get all active services with doctor information."""
        response = self.client.table("services")\
            .select("*, doctors(name, clinic_name)")\
            .eq("is_active", True)\
            .execute()
        return response.data

    # ==================== Available Slots ====================

    def get_available_slots(self, target_date: str) -> List[str]:
        """
        Get available time slots for a given date.
        Returns list of available times.

        Simple implementation: Return predefined slots minus booked ones.
        """
        # Define default available slots (9 AM to 5 PM, 30-min intervals)
        all_slots = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
            "15:00", "15:30", "16:00", "16:30", "17:00"
        ]

        # Get booked slots for this date
        response = self.client.table("bookings")\
            .select("time")\
            .eq("date", target_date)\
            .in_("status", ["pending", "confirmed"])\
            .execute()

        # Remove booked slots
        booked_times = [booking["time"] for booking in response.data]
        available = [slot for slot in all_slots if slot not in booked_times]

        return available

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
