# 🚀 Quick Start Guide

Get your dental booking agent running in 5 minutes!

## Step 1: Setup Environment (2 min)

```bash
cd dental-booking/backend

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your favorite editor
```

Add your keys:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-xxxxx
DEFAULT_LANGUAGE=ar
```

## Step 2: Install Dependencies (1 min)

```bash
pip install -r requirements.txt
```

Or use the run script:
```bash
./run.sh  # Installs dependencies and starts server
```

## Step 3: Setup Database (1 min)

1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy and run `supabase/seed.sql`

## Step 4: Start Server (30 sec)

```bash
# Option 1: Using script
./run.sh

# Option 2: Manual
cd app
python main.py

# Option 3: With uvicorn
uvicorn app.main:app --reload --port 8000
```

Server runs at: `http://localhost:8000`

## Step 5: Test It! (30 sec)

### Quick Test (curl)

```bash
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599123456","message":"السلام عليكم"}'
```

### Full Test Suite

```bash
python test_agent.py
```

### Interactive Testing

Use the API docs: `http://localhost:8000/docs`

## 📱 Example Conversations

### Arabic (Quick Copy-Paste)

```bash
# Message 1
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599123456","message":"السلام عليكم"}'

# Message 2
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599123456","message":"محمد أحمد"}'

# Message 3 (select service)
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599123456","message":"تنظيف"}'

# Message 4 (date)
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599123456","message":"غداً"}'

# Message 5 (time)
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599123456","message":"10:00"}'
```

### English

```bash
curl -X POST http://localhost:8000/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"phone":"972599999888","message":"Hello","language":"en"}'
```

## 🔍 Verify It Works

```bash
# Check health
curl http://localhost:8000/health

# View services
curl http://localhost:8000/services

# Check available slots
curl http://localhost:8000/slots/2024-01-16

# View conversation
curl http://localhost:8000/conversation/972599123456
```

## 🎯 What to Check in Supabase

After testing, verify in your Supabase dashboard:

1. **patients table**: New patient records
2. **bookings table**: Created appointments
3. **conversations table**: Chat history and state

## ⚡ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Module not found | `pip install -r requirements.txt` |
| Connection refused | Check server is running on port 8000 |
| Database error | Verify SUPABASE credentials in .env |
| OpenAI error | Check OPENAI_API_KEY in .env |
| No services | Run seed.sql in Supabase |

## 🎉 You're Ready!

Your booking agent is now running. Next steps:

1. ✅ Test different conversation flows
2. ✅ Check Supabase data
3. ✅ Try error cases (invalid dates, etc.)
4. ✅ Test in both Arabic and English

## 📚 More Info

- Full documentation: `README.md`
- API documentation: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`

---

**Need help?** Check the README.md file for detailed information.
