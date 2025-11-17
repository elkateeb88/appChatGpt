"""
FastAPI application for the dental booking agent.
"""
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.agent import agent
from app.database import db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Dental Booking Agent API",
    description="AI-powered dental appointment booking system for Gaza",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Request/Response Models ====================

class MessageRequest(BaseModel):
    """Incoming message from patient."""
    phone: str = Field(..., description="Patient's phone number (e.g., 972599123456)")
    message: str = Field(..., description="Message text from patient")
    language: Optional[str] = Field(None, description="Language code: 'ar' or 'en'. Auto-detected if not provided.")


class MessageResponse(BaseModel):
    """Response from booking agent."""
    reply: str = Field(..., description="Bot's reply message")
    language: str = Field(..., description="Language used for the reply")
    phone: str = Field(..., description="Patient's phone number")


# ==================== Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "service": "Dental Booking Agent",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        db.client.table("services").select("count", count="exact").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "agent": "ready"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@app.post("/webhook/message", response_model=MessageResponse)
async def receive_message(request: MessageRequest):
    """
    Receive and process a message from a patient.

    This endpoint:
    1. Receives a message from a patient via phone number
    2. Processes it through the booking agent
    3. Returns the agent's reply

    Example request:
    ```json
    {
        "phone": "972599123456",
        "message": "السلام عليكم",
        "language": "ar"
    }
    ```

    Example response:
    ```json
    {
        "reply": "أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟",
        "language": "ar",
        "phone": "972599123456"
    }
    ```
    """
    try:
        logger.info(f"Received message from {request.phone}: {request.message}")

        # Process message through agent
        reply = agent.process_message(
            patient_phone=request.phone,
            message=request.message,
            language=request.language
        )

        # Determine language used (from request or detected)
        language = request.language
        if not language:
            # Re-detect from reply if needed
            has_arabic = any('\u0600' <= char <= '\u06FF' for char in reply)
            language = "ar" if has_arabic else "en"

        logger.info(f"Agent reply to {request.phone}: {reply}")

        return MessageResponse(
            reply=reply,
            language=language,
            phone=request.phone
        )

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@app.get("/doctors")
async def get_doctors(is_active: Optional[bool] = None):
    """Get all doctors, optionally filtered by active status."""
    try:
        doctors = db.get_doctors(is_active=is_active)
        return {"doctors": doctors, "count": len(doctors)}
    except Exception as e:
        logger.error(f"Error fetching doctors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    """Get a specific doctor by ID."""
    try:
        doctor = db.get_doctor(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return doctor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/doctors/{doctor_id}/availability")
async def get_doctor_availability(doctor_id: str):
    """Get availability schedule for a doctor."""
    try:
        availability = db.get_doctor_availability(doctor_id)
        return {"availability": availability, "doctor_id": doctor_id}
    except Exception as e:
        logger.error(f"Error fetching doctor availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/doctors/{doctor_id}/availability")
async def update_doctor_availability(
    doctor_id: str,
    availability: List[Dict[str, Any]] = Body(...)
):
    """
    Update doctor availability schedule.

    Request body should be a list of availability objects:
    ```json
    [
        {
            "day_of_week": 0,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "is_available": true
        }
    ]
    ```
    """
    try:
        updated = db.update_doctor_availability(doctor_id, availability)
        return {"success": True, "availability": updated}
    except Exception as e:
        logger.error(f"Error updating doctor availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/services")
async def get_services():
    """Get all active services (for testing/debugging)."""
    try:
        services = db.get_active_services()
        return {"services": services, "count": len(services)}
    except Exception as e:
        logger.error(f"Error fetching services: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/slots/{date}")
async def get_slots(date: str):
    """
    Get available time slots for a specific date (for testing/debugging).

    Example: GET /slots/2024-01-15
    """
    try:
        slots = db.get_available_slots(date)
        return {"date": date, "available_slots": slots, "count": len(slots)}
    except Exception as e:
        logger.error(f"Error fetching slots: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations")
async def get_conversations(limit: int = 50):
    """Get all conversations."""
    try:
        conversations = db.get_all_conversations(limit=limit)
        return {"conversations": conversations, "count": len(conversations)}
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversation/{phone}")
async def get_conversation(phone: str):
    """Get conversation history for a patient (for testing/debugging)."""
    try:
        conversation = db.get_conversation(phone)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bookings")
async def get_bookings(
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    doctor_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get all bookings with optional filters.

    Query parameters:
    - status: Filter by status (pending, confirmed, completed, cancelled)
    - date_from: Filter bookings from this date (YYYY-MM-DD)
    - date_to: Filter bookings until this date (YYYY-MM-DD)
    - doctor_id: Filter by doctor ID
    - limit: Maximum number of results (default: 100)
    """
    try:
        bookings = db.get_bookings(
            status=status,
            date_from=date_from,
            date_to=date_to,
            doctor_id=doctor_id,
            limit=limit
        )
        return {"bookings": bookings, "count": len(bookings)}
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bookings/stats")
async def get_booking_stats():
    """Get booking statistics (counts by status)."""
    try:
        stats = db.get_booking_stats()
        return stats
    except Exception as e:
        logger.error(f"Error fetching booking stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str):
    """
    Update booking status.

    Args:
        booking_id: UUID of the booking
        status: New status (pending, confirmed, completed, cancelled)
    """
    try:
        booking = db.update_booking_status(booking_id, status)
        return {"success": True, "booking": booking}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating booking status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/whatsapp/status")
async def whatsapp_status():
    """
    Get WhatsApp Business API status.

    Returns:
        - connected: bool - Whether WhatsApp is configured
        - status: str - Connection status
        - apiType: str - API type (Cloud API)
    """
    import httpx

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://whatsapp:3002/status", timeout=5.0)
            return response.json()
    except Exception as e:
        logger.error(f"Failed to get WhatsApp status: {str(e)}")
        return {
            "connected": False,
            "status": "error",
            "message": "Cannot connect to WhatsApp gateway"
        }


# ==================== Run the application ====================

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
