# 🦷 Dental Booking Agent - AI-Powered Appointment System

AI-powered dental appointment booking system for Gaza. Built with Python FastAPI, OpenAI GPT-4o-mini, and Supabase.

## 🎯 Features

- **Conversational AI Agent**: Natural language booking in Arabic and English
- **OpenAI Function Calling**: Intelligent tool usage for database operations
- **Bilingual Support**: Palestinian Arabic dialect + English
- **Stateful Conversations**: Persistent conversation history in Supabase
- **Simple REST API**: Easy-to-test endpoints for integration

## 📋 Prerequisites

- Python 3.9+
- Supabase account (free tier works)
- OpenAI API key

## 🚀 Quick Start

### 1. Clone & Navigate

```bash
git clone https://github.com/elkateeb88/appChatGpt.git
cd appChatGpt/dental-booking/backend
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
3. Copy contents of `dental-booking/supabase/seed.sql`
4. Run the SQL script

This creates:
- Database tables (doctors, services, patients, conversations, bookings)
- 1 sample doctor
- 5 sample dental services

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
│   ├── run.sh
│   └── test_agent.py
├── supabase/
│   └── seed.sql            # Database schema & sample data
├── README.md
├── QUICK_START.md
└── .gitignore
```

## 🛠️ How It Works

### Agent Architecture

The booking agent uses OpenAI's function calling with 3 tools:

- **get_active_services()**: Fetch available dental services
- **get_available_slots(date)**: Check appointment availability
- **create_booking(data)**: Save booking to database

### Conversation Flow

1. Patient sends message → FastAPI endpoint
2. Agent retrieves conversation history from Supabase
3. Sends context to OpenAI with function definitions
4. OpenAI decides when to call tools
5. Agent executes tools and updates conversation state
6. Returns natural language response

### State Management

- All conversations stored in `conversations` table
- Message history preserved for context
- Collected data (name, service, date, time) tracked in JSONB field

## 🎨 Sample Services

| Service (AR)       | Service (EN)              | Price | Duration |
|--------------------|---------------------------|-------|----------|
| فحص وتشخيص         | Examination & Diagnosis   | 50₪   | 30 min   |
| تنظيف الأسنان      | Teeth Cleaning            | 100₪  | 45 min   |
| حشوة عادية         | Regular Filling           | 150₪  | 60 min   |
| خلع سن             | Tooth Extraction          | 120₪  | 30 min   |
| تبييض الأسنان      | Teeth Whitening           | 300₪  | 90 min   |

## 🔄 Next Steps (Future Features)

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

## 📞 Support

For detailed documentation, see:
- [dental-booking/README.md](dental-booking/README.md) - Complete documentation
- [dental-booking/QUICK_START.md](dental-booking/QUICK_START.md) - Quick start guide

---

**Made with ❤️ for Gaza dental clinics**
