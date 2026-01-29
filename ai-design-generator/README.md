# AI Design Generator

نظام AI لتوليد تصاميم سوشيال ميديا تلقائياً من ملفات PSD templates.

## المميزات

- 📤 رفع ملفات PSD وتحليل الطبقات تلقائياً
- 💬 إنشاء تصاميم عبر المحادثة بالعربي أو الإنجليزي
- 🤖 Agent ذكي يختار التصميم المناسب ويولد المحتوى
- 🖼️ تصدير التصاميم بصيغة PNG جاهزة للنشر

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **AI Agent**: LangGraph + GPT-4o-mini
- **PSD Processing**: psd-tools + Pillow

## التشغيل السريع

### باستخدام Docker

```bash
# نسخ ملف البيئة
cp backend/.env.example backend/.env
# تعديل OPENAI_API_KEY في الملف

# تشغيل الخدمات
docker-compose up -d

# الواجهة الأمامية: http://localhost:3000
# API: http://localhost:8000
```

### التشغيل محلياً

#### Backend

```bash
cd backend

# إنشاء بيئة افتراضية
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو
.\venv\Scripts\activate  # Windows

# تثبيت المتطلبات
pip install -r requirements.txt

# إعداد البيئة
cp .env.example .env
# تعديل DATABASE_URL و OPENAI_API_KEY

# تشغيل السيرفر
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# تثبيت المتطلبات
npm install

# تشغيل السيرفر
npm run dev
```

## الاستخدام

### 1. رفع Templates

1. اذهب إلى صفحة المكتبة `/library`
2. اضغط "رفع جديد"
3. اختر ملف PSD
4. النظام سيحلل الطبقات تلقائياً
5. أضف اسم وتصنيف واحفظ

### 2. إنشاء تصميم

1. اذهب إلى صفحة التوليد `/generate`
2. اكتب طلبك في الشات، مثال:
   - "اعملي بوست عرض قهوة تركية خصم 30%"
   - "ستوري إعلان منتج جديد"
3. انتظر الـ Agent يعمل شغله
4. حمّل التصميم النهائي

## API Endpoints

### Templates

```
POST   /api/templates/upload     # رفع PSD جديد
GET    /api/templates            # قائمة Templates
GET    /api/templates/{id}       # تفاصيل template
DELETE /api/templates/{id}       # حذف
```

### Chat

```
POST   /api/chat                 # إرسال رسالة للـ Agent
```

### Outputs

```
GET    /api/outputs/{filename}   # تحميل الصورة المولدة
```

## هيكل المشروع

```
ai-design-generator/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Settings
│   │   ├── api/              # API routes
│   │   ├── agent/            # LangGraph agent
│   │   ├── services/         # Business logic
│   │   ├── models/           # Database models
│   │   └── schemas/          # Pydantic schemas
│   ├── storage/              # File storage
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities & API client
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/designgen
OPENAI_API_KEY=sk-...
FREEPIK_API_KEY=...  # اختياري لتوليد الصور
STORAGE_PATH=./storage
```

## المساهمة

المشروع مفتوح للمساهمات. يرجى فتح Issue أو Pull Request.

## الترخيص

MIT License
