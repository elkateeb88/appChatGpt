# 🦷 Dental Booking Agent - MVP

AI-powered dental appointment booking system for Gaza. Built with Python FastAPI, OpenAI GPT-4o-mini, and Supabase.

## 🎯 Features

- **Conversational AI Agent**: Natural language booking in Arabic and English
- **OpenAI Function Calling**: Intelligent tool usage for database operations
- **Bilingual Support**: Palestinian Arabic dialect + English
- **Stateful Conversations**: Persistent conversation history in Supabase
- **Simple API**: Easy-to-test REST endpoints

## 📋 Prerequisites

- Python 3.9+
- Supabase account (free tier works)
- OpenAI API key

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd dental-booking/backend
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Application Settings
DEFAULT_LANGUAGE=ar
ENVIRONMENT=development
```

### 4. Setup Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy contents of `../supabase/seed.sql`
4. Run the SQL script

This creates:
- Database tables (doctors, services, patients, conversations, bookings)
- 1 sample doctor
- 5 sample services

### 5. Run the Server

```bash
cd app
python main.py
```

Or using uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at: `http://localhost:8000`

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

### Send Message (Main Endpoint)

```bash
POST /webhook/message
Content-Type: application/json

{
  "phone": "972599123456",
  "message": "السلام عليكم",
  "language": "ar"  // optional: "ar" or "en"
}
```

Response:

```json
{
  "reply": "أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟",
  "language": "ar",
  "phone": "972599123456"
}
```

### Helper Endpoints (for testing)

```bash
# Get all services
GET /services

# Get available slots for a date
GET /slots/2024-01-15

# Get conversation history
GET /conversation/972599123456
```

## 🧪 Testing

### Test with curl (Arabic)

```bash
# Start conversation
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "972599123456",
    "message": "السلام عليكم"
  }'

# Provide name
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "972599123456",
    "message": "محمد علي"
  }'

# Select service
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "972599123456",
    "message": "تنظيف أسنان"
  }'

# Choose date
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "972599123456",
    "message": "غداً"
  }'

# Select time
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "972599123456",
    "message": "10:00"
  }'
```

### Test with curl (English)

```bash
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "972599999888",
    "message": "Hello, I need an appointment",
    "language": "en"
  }'
```

### Test with Python

```python
import requests

url = "http://localhost:8000/webhook/message"

# Arabic conversation
response = requests.post(url, json={
    "phone": "972599123456",
    "message": "السلام عليكم"
})

print(response.json())
```

### Test with Postman

1. Create new POST request to `http://localhost:8000/webhook/message`
2. Set Headers: `Content-Type: application/json`
3. Body (raw JSON):
   ```json
   {
     "phone": "972599123456",
     "message": "السلام عليكم"
   }
   ```
4. Send and see the bot's reply

## 💬 Example Conversation Flow

**Arabic (Palestinian Dialect):**

```
Patient: السلام عليكم
Bot: أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟

Patient: محمد علي
Bot: أهلاً محمد! شو الخدمة اللي بتحتاجها؟

1️⃣ فحص وتشخيص - 50₪ (30 دقيقة)
2️⃣ تنظيف الأسنان - 100₪ (45 دقيقة)
3️⃣ حشوة عادية - 150₪ (60 دقيقة)
4️⃣ خلع سن - 120₪ (30 دقيقة)
5️⃣ تبييض الأسنان - 300₪ (90 دقيقة)

Patient: 2
Bot: تمام! اخترت تنظيف الأسنان. أي يوم بيناسبك؟

Patient: غداً
Bot: الأوقات المتاحة ليوم 2024-01-16:
• 10:00 صباحاً
• 11:30 صباحاً
• 02:00 مساءً
• 03:30 مساءً
شو الوقت المناسب لك؟

Patient: 10:00
Bot: تمام! تم حجز الموعد بنجاح ✅

📋 ملخص الحجز:
الاسم: محمد علي
الخدمة: تنظيف الأسنان
التاريخ: 2024-01-16
الوقت: 10:00 صباحاً
السعر: 100₪

بنشوفك! 😊
```

**English:**

```
Patient: Hello, I need an appointment
Bot: Hello! May I have your full name please?

Patient: John Smith
Bot: Hello John! Which service do you need?

1️⃣ Examination & Diagnosis - 50₪
2️⃣ Teeth Cleaning - 100₪
3️⃣ Regular Filling - 150₪
4️⃣ Tooth Extraction - 120₪
5️⃣ Teeth Whitening - 300₪

Patient: Teeth cleaning
Bot: Great! What date works for you?
...
```

## 🗂️ Project Structure

```
dental-booking/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app & endpoints
│   │   ├── agent.py         # Booking agent with OpenAI tools
│   │   ├── database.py      # Supabase client & operations
│   │   └── config.py        # Configuration management
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                 # Your credentials (not in git)
├── supabase/
│   └── seed.sql            # Database schema & sample data
└── README.md
```

## 🛠️ How It Works

### 1. Agent Architecture

The booking agent (`agent.py`) uses OpenAI's function calling to:

- **get_active_services()**: Fetch available dental services
- **get_available_slots(date)**: Check appointment availability
- **create_booking(data)**: Save booking to database

### 2. Conversation Flow

1. Patient sends message → FastAPI endpoint
2. Agent retrieves conversation history from Supabase
3. Sends context to OpenAI with function definitions
4. OpenAI decides when to call tools (get services, check slots, create booking)
5. Agent executes tools and updates conversation state
6. Returns natural language response

### 3. State Management

- All conversations stored in `conversations` table
- Message history preserved for context
- Collected data (name, service, date, time) tracked in JSONB field

## 🎨 Sample Services

The seed data includes 5 services:

| Service (AR)       | Service (EN)              | Price | Duration |
|--------------------|---------------------------|-------|----------|
| فحص وتشخيص         | Examination & Diagnosis   | 50₪   | 30 min   |
| تنظيف الأسنان      | Teeth Cleaning            | 100₪  | 45 min   |
| حشوة عادية         | Regular Filling           | 150₪  | 60 min   |
| خلع سن             | Tooth Extraction          | 120₪  | 30 min   |
| تبييض الأسنان      | Teeth Whitening           | 300₪  | 90 min   |

## 🐛 Troubleshooting

### "Module not found" error

```bash
# Make sure you're in the right directory
cd dental-booking/backend

# Reinstall dependencies
pip install -r requirements.txt
```

### Database connection error

- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check if you ran the seed.sql script
- Ensure Supabase project is active

### OpenAI API error

- Verify `OPENAI_API_KEY` in `.env`
- Check API key is valid and has credits
- Model `gpt-4o-mini` is available

### Agent not calling tools

- Check OpenAI function definitions in `agent.py`
- Verify database has services (GET /services)
- Check logs for errors

## 📊 Database Schema

### Tables

- **doctors**: Dental doctors/dentists
- **services**: Available dental services
- **patients**: Registered patients
- **conversations**: Chat history and state
- **bookings**: Appointment bookings

### Key Fields

**bookings table:**
- `status`: pending | confirmed | cancelled | completed
- `date`: Booking date (YYYY-MM-DD)
- `time`: Booking time (HH:MM)
- `language`: ar | en

**conversations table:**
- `collected_data`: JSONB with booking progress
- `messages`: JSONB array of chat history

## 🔄 Next Steps (Not in MVP)

- [ ] WhatsApp integration with Baileys
- [ ] Admin dashboard (Next.js)
- [ ] SMS notifications
- [ ] Multi-doctor support
- [ ] Authentication & authorization
- [ ] Booking cancellation/rescheduling
- [ ] Calendar view
- [ ] Reporting & analytics

## 📝 License

MIT

## 🤝 Contributing

This is an MVP prototype. For production use, add:
- Input validation
- Rate limiting
- Error handling
- Logging
- Authentication
- Tests

## 📞 Support

For issues or questions, check:
1. Logs in console
2. Supabase dashboard (database tables)
3. OpenAI API status
4. Environment variables

---

**Made with ❤️ for Gaza dental clinics**
