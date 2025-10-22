#!/usr/bin/env node

/**
 * تطبيق نيمرو - Nimro Communication Plans Prototype
 * بروتوتايب لعرض باقات الاتصالات (eSIM والأرقام الافتراضية)
 * باستخدام OpenAI Apps SDK (MCP)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// بيانات الباقات الوهمية
const MOCK_PLANS = {
  'virtual-number': {
    id: 'virtual-number',
    name: 'باقة الرقم الافتراضي',
    nameEn: 'Virtual Number Plan',
    price: 3.99,
    currency: 'USD',
    period: 'شهر',
    periodEn: 'month',
    features: [
      'رقم هاتف أمريكي/دولي',
      '100 دقيقة مكالمات محلية',
      'استقبال SMS غير محدود'
    ],
    featuresEn: [
      'US/International Phone Number',
      '100 Local Minutes',
      'Unlimited SMS Reception'
    ],
    type: 'أرقام افتراضية'
  },
  'esim-data': {
    id: 'esim-data',
    name: 'باقة البيانات العالمية',
    nameEn: 'Global Data Plan',
    price: 19.99,
    currency: 'USD',
    period: '7 أيام',
    periodEn: '7 days',
    features: [
      '5 جيجابايت بيانات سفر',
      'تغطية 100+ دولة',
      'تفعيل فوري (eSIM)'
    ],
    featuresEn: [
      '5GB Travel Data',
      '100+ Countries Coverage',
      'Instant Activation (eSIM)'
    ],
    type: 'eSIM'
  },
  'combo-plan': {
    id: 'combo-plan',
    name: 'الباقة الشاملة',
    nameEn: 'Complete Bundle Plan',
    price: 49.99,
    currency: 'USD',
    period: 'شهر',
    periodEn: 'month',
    features: [
      'رقم افتراضي + بيانات',
      '10GB بيانات عالمية',
      '300 دقيقة دولية'
    ],
    featuresEn: [
      'Virtual Number + Data',
      '10GB Global Data',
      '300 International Minutes'
    ],
    type: 'الكل',
    popular: true
  }
};

// إنشاء خادم MCP
const server = new Server(
  {
    name: 'nimro-communication-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// تسجيل معالج قائمة الأدوات
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'عرض_باقات_الاتصالات',
        description: 'تستخدم لعرض الباقات المتوفرة من نيمرو، مثل الأرقام الافتراضية وباقات eSIM، في واجهة تفاعلية داخل ChatGPT.',
        inputSchema: {
          type: 'object',
          properties: {
            نوع_الخدمة: {
              type: 'string',
              description: "نوع الخدمة المراد عرض باقاتها. يمكن أن تكون 'eSIM' أو 'أرقام افتراضية' أو 'الكل' (افتراضي).",
              enum: ['eSIM', 'أرقام افتراضية', 'الكل'],
              default: 'الكل'
            }
          },
          required: []
        }
      },
      {
        name: 'تفعيل_باقة',
        description: 'تفعيل باقة معينة من باقات نيمرو (محاكاة)',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: {
              type: 'string',
              description: 'معرف الباقة المراد تفعيلها',
              enum: ['virtual-number', 'esim-data', 'combo-plan']
            }
          },
          required: ['plan_id']
        }
      },
      {
        name: 'استعراض_تفاصيل_الباقة',
        description: 'الحصول على تفاصيل موسعة لباقة معينة',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: {
              type: 'string',
              description: 'معرف الباقة المراد استعراض تفاصيلها',
              enum: ['virtual-number', 'esim-data', 'combo-plan']
            }
          },
          required: ['plan_id']
        }
      }
    ],
  };
});

// تسجيل معالج استدعاء الأدوات
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'عرض_باقات_الاتصالات') {
      const serviceType = args?.نوع_الخدمة || 'الكل';

      // تصفية الباقات حسب نوع الخدمة
      let filteredPlans = Object.values(MOCK_PLANS);
      if (serviceType !== 'الكل') {
        filteredPlans = filteredPlans.filter(plan =>
          plan.type === serviceType || plan.type === 'الكل'
        );
      }

      // إرجاع واجهة HTML كاملة
      return {
        content: [
          {
            type: 'text',
            text: `تم تحميل ${filteredPlans.length} باقة من نيمرو (${serviceType})`
          },
          {
            type: 'resource',
            resource: {
              uri: 'ui://plans-display',
              mimeType: 'text/html',
              text: generatePlansHTML(filteredPlans)
            }
          }
        ],
      };
    }

    if (name === 'تفعيل_باقة') {
      const planId = args.plan_id;
      const plan = MOCK_PLANS[planId];

      if (!plan) {
        throw new Error(`الباقة ${planId} غير موجودة`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ تم تفعيل "${plan.name}" بنجاح!\n\n` +
                  `💰 السعر: $${plan.price} / ${plan.period}\n` +
                  `📦 الميزات:\n${plan.features.map(f => `  • ${f}`).join('\n')}\n\n` +
                  `📧 سيتم إرسال تفاصيل التفعيل إلى بريدك الإلكتروني.\n` +
                  `⏰ التفعيل الفعلي: فوري (محاكاة)`
          }
        ],
      };
    }

    if (name === 'استعراض_تفاصيل_الباقة') {
      const planId = args.plan_id;
      const plan = MOCK_PLANS[planId];

      if (!plan) {
        throw new Error(`الباقة ${planId} غير موجودة`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `📋 **${plan.name}** (${plan.nameEn})\n\n` +
                  `💵 **السعر:** $${plan.price} / ${plan.period}\n\n` +
                  `✨ **الميزات الكاملة:**\n${plan.features.map((f, i) =>
                    `  ${i + 1}. ${f}`
                  ).join('\n')}\n\n` +
                  `🌍 **نوع الخدمة:** ${plan.type}\n` +
                  (plan.popular ? `🏆 **الأكثر شعبية** - الخيار المفضل للعملاء\n` : '') +
                  `\n📞 **معلومات إضافية:**\n` +
                  `  • التفعيل: فوري عبر الإنترنت\n` +
                  `  • الإلغاء: في أي وقت\n` +
                  `  • الدعم الفني: 24/7 عبر الدردشة\n` +
                  `  • طرق الدفع: Visa, MasterCard, PayPal, Apple Pay`
          }
        ],
      };
    }

    throw new Error(`أداة غير معروفة: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `خطأ: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// دالة لتوليد HTML للباقات
function generatePlansHTML(plans) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>باقات نيمرو</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            margin: 0;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 32px;
        }
        .header h1 {
            font-size: 2em;
            margin: 0 0 8px 0;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .plans-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .plan-card {
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 16px;
            padding: 28px;
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .plan-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 48px rgba(0,0,0,0.2);
        }
        .plan-card.popular {
            border-color: #007aff;
            border-width: 3px;
            transform: scale(1.05);
        }
        .plan-card.popular:hover {
            transform: scale(1.05) translateY(-8px);
        }
        .popular-badge {
            position: absolute;
            top: -12px;
            right: 20px;
            background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
            letter-spacing: 0.5px;
        }
        .title {
            font-size: 1.4em;
            font-weight: 700;
            color: #1c1c1e;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .price {
            font-size: 2.2em;
            font-weight: 800;
            background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
        }
        .price-period {
            font-size: 0.4em;
            opacity: 0.7;
            font-weight: 500;
        }
        .features {
            list-style: none;
            padding: 0;
            margin: 20px 0;
            text-align: right;
        }
        .features li {
            margin-bottom: 10px;
            font-size: 0.95em;
            color: #3a3a3c;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            line-height: 1.5;
        }
        .features li:last-child {
            border-bottom: none;
        }
        .cta-group {
            margin-top: 24px;
        }
        .cta-group button {
            display: block;
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1em;
            margin-top: 10px;
            transition: all 0.2s ease;
            border: none;
        }
        .cta-primary {
            background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }
        .cta-primary:hover {
            box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
            transform: translateY(-2px);
        }
        .cta-secondary {
            background: transparent;
            color: #007aff;
            border: 2px solid #007aff;
        }
        .cta-secondary:hover {
            background: rgba(0, 122, 255, 0.1);
        }
        .type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 0.85em;
            font-weight: 600;
            margin-bottom: 12px;
            background: #f2f2f7;
            color: #636366;
        }
    </style>
</head>
<body>

<div class="header">
    <h1>🌟 باقات نيمرو</h1>
    <p>اختر الباقة المثالية لاحتياجاتك</p>
</div>

<div class="plans-container">
${plans.map(plan => `
    <div class="plan-card${plan.popular ? ' popular' : ''}">
        ${plan.popular ? '<div class="popular-badge">⭐ الأكثر شعبية</div>' : ''}
        <div class="type-badge">${plan.type}</div>
        <div class="title">${plan.name}</div>
        <div class="price">$${plan.price} <span class="price-period">/ ${plan.period}</span></div>
        <ul class="features">
            ${plan.features.map(feature => `<li>✅ ${feature}</li>`).join('')}
        </ul>
        <div class="cta-group">
            <button class="cta-primary" onclick="selectPlan('${plan.id}')">🚀 تفعيل الباقة</button>
            <button class="cta-secondary" onclick="showDetails('${plan.id}')">📖 استعراض الميزات</button>
        </div>
    </div>
`).join('')}
</div>

<script>
    // التفاعل مع ChatGPT عبر Apps SDK/MCP
    function selectPlan(planId) {
        const message = \`الرجاء تفعيل الباقة: \${planId}\`;

        // محاولة استخدام window.openai إذا كان متاحاً
        if (window.openai && window.openai.postMessage) {
            window.openai.postMessage('action:purchase_plan', {
                plan_id: planId,
                user_intent: message
            });
        } else if (window.parent && window.parent.postMessage) {
            // استخدام postMessage القياسي كبديل
            window.parent.postMessage({
                type: 'nimro:activate_plan',
                planId: planId,
                message: message
            }, '*');
        } else {
            alert(\`✅ محاكاة: تم طلب تفعيل الباقة \${planId}\`);
        }
    }

    function showDetails(planId) {
        const message = \`أريد المزيد من التفاصيل حول الباقة: \${planId}\`;

        if (window.openai && window.openai.postMessage) {
            window.openai.postMessage('text:request_details', {
                plan_id: planId,
                user_intent: message
            });
        } else if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'nimro:show_details',
                planId: planId,
                message: message
            }, '*');
        } else {
            alert(\`📖 محاكاة: تم طلب تفاصيل الباقة \${planId}\`);
        }
    }

    // الاستماع للرسائل من النافذة الأم
    window.addEventListener('message', function(event) {
        console.log('Received message:', event.data);
    });
</script>

</body>
</html>`;
}

// بدء الخادم
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Nimro Communication MCP Server running on stdio');
}

main().catch((error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
