# 🦷 Dental Booking Agent - AI-Powered Appointment System

AI-powered dental appointment booking system for Gaza. Built with Python FastAPI, OpenAI GPT-4o-mini, Supabase, and Next.js Dashboard.

## 🎯 Features

### Backend (FastAPI)
- **Conversational AI Agent**: Natural language booking in Arabic and English
- **OpenAI Function Calling**: Intelligent tool usage for database operations
- **Bilingual Support**: Palestinian Arabic dialect + English
- **Stateful Conversations**: Persistent conversation history in Supabase
- **Simple REST API**: Easy-to-test endpoints for integration

### Dashboard (Next.js 15)
- **Modern Admin Panel**: Built with Next.js 15, React 19, and TypeScript
- **shadcn/ui Components**: Beautiful, accessible UI components
- **Real-time Monitoring**: Track bookings, services, and conversations
- **Responsive Design**: Works on all devices
- **Dark Mode Support**: Built-in theme switching

## 📋 Prerequisites

- Docker & Docker Compose (recommended) OR
- Python 3.9+ and Node.js 20+
- Supabase account (free tier works)
- OpenAI API key

## 🚀 Quick Start (Docker - Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/elkateeb88/appChatGpt.git
cd appChatGpt
```

### 2. Configure Environment

Create `.env` files:

```bash
# Root .env (for docker-compose)
cp .env.example .env

# Backend .env
cp dental-booking/backend/.env.example dental-booking/backend/.env
```

Edit both `.env` files with your credentials:

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

### 3. Setup Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy contents of `dental-booking/supabase/seed.sql`
4. Run the SQL script

This creates:
- Database tables (doctors, services, patients, conversations, bookings)
- 1 sample doctor
- 5 sample dental services

### 4. Build & Run with Docker

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5. Access Applications

- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

### 6. Stop Services

```bash
docker-compose down
```

---

## 🛠️ Manual Setup (Without Docker)

### Backend

```bash
cd dental-booking/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Dashboard

```bash
cd dental-booking/dashboard
npm install
npm run dev
```

Dashboard: http://localhost:3001
Backend: http://localhost:8001

---

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
.
├── docker-compose.yml           # Docker orchestration
├── .env.example                 # Environment variables template
├── DOCKER_SETUP.md             # Docker setup guide
├── package.json                 # Root npm scripts
└── dental-booking/
    ├── backend/
    │   ├── Dockerfile          # Backend container config
    │   ├── app/
    │   │   ├── main.py         # FastAPI app & endpoints
    │   │   ├── agent.py        # Booking agent with OpenAI
    │   │   ├── database.py     # Supabase operations
    │   │   └── config.py       # Configuration
    │   └── requirements.txt
    ├── dashboard/
    │   ├── Dockerfile          # Dashboard container config
    │   ├── app/
    │   │   ├── page.tsx        # Home dashboard
    │   │   ├── bookings/       # Bookings page
    │   │   ├── services/       # Services page
    │   │   └── conversations/  # Conversations page
    │   ├── components/
    │   │   └── ui/             # shadcn/ui components
    │   ├── lib/
    │   │   └── api.ts          # API client
    │   └── package.json
    ├── whatsapp-gateway/
    │   ├── Dockerfile          # WhatsApp container config
    │   ├── index.js            # Baileys integration
    │   └── package.json
    └── supabase/
        └── seed.sql            # Database schema
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

## 🎨 Dashboard Features

The Next.js dashboard provides:

- **Overview Page**: System health, stats, and quick actions
- **Bookings Management**: View and manage all appointments
- **Services**: Display all dental services with pricing
- **Conversations**: Track patient interactions with the bot
- **Real-time API Integration**: Live data from backend
- **Responsive Design**: Works on mobile, tablet, and desktop
- **shadcn/ui Components**: Modern, accessible UI

## 🔄 Next Steps (Future Features)

- [ ] WhatsApp integration with Baileys
- [x] Admin dashboard (Next.js) - ✅ Completed
- [ ] SMS notifications
- [ ] Multi-doctor support
- [ ] Authentication & authorization
- [ ] Booking cancellation/rescheduling
- [ ] Calendar view with drag & drop
- [ ] Reporting & analytics
- [ ] Real-time notifications
- [ ] Patient portal

## 📝 License

MIT

## 📚 Documentation

- [dental-booking/README.md](dental-booking/README.md) - Backend API documentation
- [dental-booking/QUICK_START.md](dental-booking/QUICK_START.md) - Quick start guide
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Docker deployment guide

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f dashboard

# Stop services
docker-compose down

# Rebuild after changes
docker-compose build
docker-compose up -d
```

## 📝 License

MIT

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure Supabase database is setup
4. Test API: http://localhost:8001/docs

---

**Made with ❤️ for Gaza dental clinics**

### Tech Stack

- **Backend**: Python 3.11, FastAPI, OpenAI GPT-4o-mini, Supabase
- **Dashboard**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Deployment**: Docker & Docker Compose
