"""
Dental Booking Agent with OpenAI Function Calling.
Handles Arabic and English conversations for appointment bookings.
"""
from openai import OpenAI
from app.config import settings
from app.database import db
from typing import Dict, List, Any, Optional
import json
from datetime import datetime, timedelta


class BookingAgent:
    """Conversational booking agent using OpenAI function calling."""

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"

    def get_tools(self) -> List[Dict]:
        """Define OpenAI function calling tools."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_active_services",
                    "description": "Get list of all active dental services available for booking. Returns service details including names in Arabic and English, prices, and duration.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_available_slots",
                    "description": "Get available appointment time slots for a specific date. Returns list of available times.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "date": {
                                "type": "string",
                                "description": "The date to check availability for, in YYYY-MM-DD format (e.g., 2024-01-15)"
                            }
                        },
                        "required": ["date"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_booking",
                    "description": "Create a new dental appointment booking. Use this when you have collected all required information: patient name, phone, service ID, date, and time.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_name": {
                                "type": "string",
                                "description": "Full name of the patient"
                            },
                            "service_id": {
                                "type": "string",
                                "description": "UUID of the selected service"
                            },
                            "date": {
                                "type": "string",
                                "description": "Booking date in YYYY-MM-DD format"
                            },
                            "time": {
                                "type": "string",
                                "description": "Booking time in HH:MM format (24-hour)"
                            },
                            "notes": {
                                "type": "string",
                                "description": "Optional notes or special requests from the patient"
                            }
                        },
                        "required": ["patient_name", "service_id", "date", "time"]
                    }
                }
            }
        ]

    def execute_tool(
        self,
        tool_name: str,
        tool_args: Dict,
        patient_phone: str,
        language: str = "ar"
    ) -> Any:
        """Execute a tool function and return results."""

        if tool_name == "get_active_services":
            services = db.get_active_services()
            # Format services for the agent
            formatted = []
            for svc in services:
                formatted.append({
                    "id": svc["id"],
                    "name_ar": svc["name_ar"],
                    "name_en": svc["name_en"],
                    "description_ar": svc.get("description_ar", ""),
                    "description_en": svc.get("description_en", ""),
                    "price": float(svc["price"]) if svc.get("price") else None,
                    "duration_minutes": svc.get("duration_minutes"),
                    "doctor": svc.get("doctors", {}).get("name") if svc.get("doctors") else None,
                    "clinic": svc.get("doctors", {}).get("clinic_name") if svc.get("doctors") else None
                })
            return formatted

        elif tool_name == "get_available_slots":
            date = tool_args.get("date")
            slots = db.get_available_slots(date)
            return slots

        elif tool_name == "create_booking":
            # Get conversation for conversation_id
            conversation = db.get_conversation(patient_phone)
            conversation_id = conversation["id"] if conversation else None

            booking = db.create_booking(
                patient_phone=patient_phone,
                patient_name=tool_args["patient_name"],
                service_id=tool_args["service_id"],
                date=tool_args["date"],
                time=tool_args["time"],
                notes=tool_args.get("notes"),
                language=language,
                conversation_id=conversation_id
            )
            return booking

        return None

    def get_system_prompt(self, language: str = "ar") -> str:
        """Get system prompt based on language."""

        if language == "ar":
            return """أنت مساعد حجز مواعيد لعيادة أسنان في غزة. اسمك "مساعد الحجز".

مهمتك: مساعدة المرضى في حجز مواعيد طبية بطريقة ودية واحترافية.

المعلومات المطلوبة للحجز:
1. اسم المريض الكامل
2. الخدمة المطلوبة (استخدم get_active_services لعرض الخدمات)
3. التاريخ المفضل
4. الوقت المفضل (استخدم get_available_slots للتحقق من الأوقات المتاحة)
5. ملاحظات (اختياري)

إرشادات المحادثة:
- استخدم اللهجة الفلسطينية العامية (مثل: شو، كيف، بدك، تمام)
- كن ودوداً ومحترماً
- اسأل سؤال واحد في كل مرة
- عند عرض الخدمات، اعرضها بشكل منظم مع الأسعار
- تأكد من توفر الوقت قبل تأكيد الحجز
- عند إتمام الحجز، استخدم create_booking واعرض ملخص الحجز

ملاحظات:
- إذا قال المستخدم "غداً" أو "بكرة"، احسب التاريخ المناسب
- إذا قال "الأسبوع الجاي"، اقترح تواريخ محددة
- الأسعار بالشيكل (₪)
- أوقات العمل: 9 صباحاً - 5 مساءً

ابدأ بالترحيب واسأل عن اسم المريض إذا كانت هذه أول رسالة."""

        else:  # English
            return """You are a dental clinic appointment booking assistant in Gaza. Your name is "Booking Assistant".

Your task: Help patients book medical appointments in a friendly and professional manner.

Required information for booking:
1. Patient's full name
2. Desired service (use get_active_services to show available services)
3. Preferred date
4. Preferred time (use get_available_slots to check availability)
5. Notes (optional)

Conversation guidelines:
- Be friendly and respectful
- Ask one question at a time
- When showing services, display them in an organized manner with prices
- Verify time availability before confirming booking
- When completing the booking, use create_booking and show a booking summary

Notes:
- If user says "tomorrow", calculate the appropriate date
- If they say "next week", suggest specific dates
- Prices are in Shekels (₪)
- Working hours: 9 AM - 5 PM

Start by greeting and asking for the patient's name if this is the first message."""

    def process_message(
        self,
        patient_phone: str,
        message: str,
        language: Optional[str] = None
    ) -> str:
        """
        Process incoming message and return bot reply.

        Args:
            patient_phone: Patient's phone number
            message: Incoming message text
            language: Preferred language (ar/en), auto-detected if None

        Returns:
            Bot's reply message
        """

        # Auto-detect language if not specified
        if language is None:
            # Simple detection: check for Arabic characters
            has_arabic = any('\u0600' <= char <= '\u06FF' for char in message)
            language = "ar" if has_arabic else "en"

        # Get or create conversation
        conversation = db.get_conversation(patient_phone)
        if not conversation:
            conversation = db.create_or_update_conversation(
                patient_phone=patient_phone,
                language=language,
                collected_data={},
                messages=[]
            )

        # Build conversation history for OpenAI
        messages = [
            {"role": "system", "content": self.get_system_prompt(language)}
        ]

        # Add conversation history
        history = conversation.get("messages", [])
        for msg in history[-10:]:  # Keep last 10 messages for context
            messages.append(msg)

        # Add current user message
        messages.append({"role": "user", "content": message})

        # Call OpenAI with function calling
        max_iterations = 5
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=self.get_tools(),
                tool_choice="auto",
                temperature=0.7
            )

            assistant_message = response.choices[0].message

            # If no tool calls, we have the final response
            if not assistant_message.tool_calls:
                reply = assistant_message.content

                # Update conversation with new messages
                db.create_or_update_conversation(
                    patient_phone=patient_phone,
                    messages=[
                        {"role": "user", "content": message},
                        {"role": "assistant", "content": reply}
                    ]
                )

                return reply

            # Process tool calls
            messages.append(assistant_message)

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                # Execute the tool
                try:
                    result = self.execute_tool(
                        function_name,
                        function_args,
                        patient_phone,
                        language
                    )

                    # Add tool result to messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": json.dumps(result, ensure_ascii=False, default=str)
                    })

                except Exception as e:
                    # Handle errors
                    error_msg = f"Error executing {function_name}: {str(e)}"
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": json.dumps({"error": error_msg})
                    })

        # If we hit max iterations, return a fallback message
        if language == "ar":
            return "عذراً، حدث خطأ. ممكن تحاول مرة ثانية؟"
        else:
            return "Sorry, an error occurred. Could you please try again?"


# Global agent instance
agent = BookingAgent()
