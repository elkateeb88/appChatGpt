# دليل نشر تطبيق نيمرو على OpenAI ChatGPT

## نظرة عامة

هذا الدليل يشرح كيفية نشر تطبيق نيمرو (Nimro Communication Plans) على منصة OpenAI ChatGPT باستخدام Model Context Protocol (MCP).

## المتطلبات الأساسية

1. **حساب OpenAI Developer**: تحتاج إلى حساب مطور على OpenAI
2. **Node.js**: الإصدار 18 أو أحدث
3. **npm**: مدير الحزم

## خطوات التثبيت المحلية

### 1. تثبيت الاعتماديات

```bash
npm install
```

### 2. اختبار التطبيق محلياً

```bash
npm start
```

أو للتطوير مع المراقبة التلقائية:

```bash
npm run dev
```

## التكامل مع ChatGPT

### الطريقة 1: استخدام MCP Inspector (للاختبار)

1. ثبّت MCP Inspector:
```bash
npx @modelcontextprotocol/inspector src/index.js
```

2. افتح المتصفح على العنوان الذي يظهر لك (عادة http://localhost:5173)

3. اختبر الأدوات المتاحة:
   - `عرض_باقات_الاتصالات`
   - `تفعيل_باقة`
   - `استعراض_تفاصيل_الباقة`

### الطريقة 2: التكامل مع ChatGPT Desktop (للمطورين)

1. افتح ملف تكوين ChatGPT Desktop:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. أضف تكوين خادم MCP:

```json
{
  "mcpServers": {
    "nimro": {
      "command": "node",
      "args": ["/path/to/appChatGpt/src/index.js"]
    }
  }
}
```

3. أعد تشغيل ChatGPT Desktop

### الطريقة 3: النشر على الإنتاج (OpenAI Apps)

> **ملاحظة**: تحتاج إلى الوصول إلى OpenAI Apps Platform (قد يكون محدوداً)

1. قم بتسجيل الدخول إلى [OpenAI Developer Platform](https://platform.openai.com/)

2. انتقل إلى قسم "Apps" أو "GPTs"

3. أنشئ تطبيق جديد وحمّل الملفات التالية:
   - `src/index.js` (الخادم الرئيسي)
   - `package.json` (التبعيات)
   - `public/ui/plans-display.html` (الواجهة)

4. قم بتكوين الأذونات والمتغيرات البيئية

## هيكل المشروع

```
appChatGpt/
├── src/
│   └── index.js              # خادم MCP الرئيسي
├── public/
│   └── ui/
│       └── plans-display.html # واجهة المستخدم
├── package.json              # ملف الحزمة والتبعيات
├── nimro-mcp-config.json     # تكوين MCP
├── README.md                 # الوثائق الرئيسية
└── DEPLOYMENT.md             # هذا الملف

```

## الأدوات المتاحة (Tools)

### 1. عرض_باقات_الاتصالات

**الوصف**: عرض جميع الباقات المتاحة في واجهة تفاعلية

**المدخلات**:
- `نوع_الخدمة` (اختياري): "eSIM" | "أرقام افتراضية" | "الكل"

**مثال الاستخدام**:
```
المستخدم: "ما هي الباقات المتوفرة؟"
ChatGPT: [يستدعي الأداة ويعرض الواجهة]
```

### 2. تفعيل_باقة

**الوصف**: تفعيل باقة معينة (محاكاة)

**المدخلات**:
- `plan_id` (مطلوب): "virtual-number" | "esim-data" | "combo-plan"

**مثال الاستخدام**:
```
المستخدم: "أريد تفعيل الباقة الشاملة"
ChatGPT: [يستدعي تفعيل_باقة مع plan_id="combo-plan"]
```

### 3. استعراض_تفاصيل_الباقة

**الوصف**: الحصول على تفاصيل موسعة لباقة محددة

**المدخلات**:
- `plan_id` (مطلوب): "virtual-number" | "esim-data" | "combo-plan"

## التخصيص

### تغيير البيانات الوهمية

يمكنك تعديل البيانات الوهمية في `src/index.js`:

```javascript
const MOCK_PLANS = {
  'your-plan-id': {
    id: 'your-plan-id',
    name: 'اسم الباقة',
    price: 9.99,
    // ... المزيد من الخصائص
  }
};
```

### تخصيص الواجهة

يمكنك تعديل التصميم في `public/ui/plans-display.html`:
- الألوان في قسم `<style>`
- المحتوى في قسم `<body>`
- التفاعلات في قسم `<script>`

## استكشاف الأخطاء

### الخطأ: "Cannot find module '@modelcontextprotocol/sdk'"

**الحل**:
```bash
npm install
```

### الخطأ: "Permission denied"

**الحل** (Linux/Mac):
```bash
chmod +x src/index.js
```

### الواجهة لا تظهر

**الحل**:
1. تحقق من أن `generatePlansHTML()` يعمل بشكل صحيح
2. تحقق من console.log في المتصفح
3. تأكد من أن ChatGPT يدعم عرض HTML/iframe

## الدعم والمساعدة

- **الوثائق الرسمية**: [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- **OpenAI Developer Forum**: [https://community.openai.com/](https://community.openai.com/)

## الترخيص

MIT License - مفتوح المصدر
