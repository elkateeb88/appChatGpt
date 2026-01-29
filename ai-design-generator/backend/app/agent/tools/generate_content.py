"""Tool for generating text content for designs."""
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from typing import Annotated
import json

from app.config import get_settings

settings = get_settings()


CONTENT_GENERATION_PROMPT = """أنت مصمم محتوى إبداعي متخصص في إنشاء نصوص تسويقية للتصاميم.

المطلوب:
{user_request}

الطبقات المتاحة في التصميم:
{layers}

اللغة المطلوبة: {language}

قواعد مهمة:
1. أنشئ نص قصير ومؤثر لكل طبقة
2. النص يجب أن يتناسب مع اسم الطبقة ووظيفتها
3. استخدم لغة تسويقية جذابة
4. إذا كانت الطبقة "Price" أو "سعر"، ضع السعر المناسب
5. إذا كانت الطبقة "CTA" أو "Button"، ضع نص دعوة للعمل

أرجع النتيجة كـ JSON object فقط بالشكل التالي:
{{
  "layer_name_1": "النص المقترح",
  "layer_name_2": "النص المقترح"
}}

لا تضف أي شرح أو نص إضافي، فقط JSON."""


@tool
async def generate_content_tool(
    template_layers: Annotated[str, "JSON string of template text layers"],
    user_request: Annotated[str, "User's design request description"],
    language: Annotated[str, "Target language (ar/en)"] = "ar",
) -> str:
    """Generate text content for design layers.

    Use this tool to create appropriate text for each text layer in the template
    based on the user's request.

    Args:
        template_layers: JSON string with layer names
        user_request: What the user wants to create
        language: Language for generated content (ar=Arabic, en=English)

    Returns:
        JSON string with layer_name: generated_text mappings
    """
    try:
        layers = json.loads(template_layers) if isinstance(template_layers, str) else template_layers
    except json.JSONDecodeError:
        layers = template_layers

    # Format layers for prompt
    layers_text = "\n".join([f"- {layer}" for layer in layers])

    # Create model
    model = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.openai_api_key,
        temperature=0.7,
    )

    # Create prompt
    prompt = ChatPromptTemplate.from_template(CONTENT_GENERATION_PROMPT)

    # Generate content
    chain = prompt | model

    response = await chain.ainvoke({
        "user_request": user_request,
        "layers": layers_text,
        "language": "العربية" if language == "ar" else "English",
    })

    # Extract JSON from response
    content = response.content.strip()

    # Try to parse as JSON
    try:
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        return json.dumps({
            "status": "success",
            "content": result
        })
    except json.JSONDecodeError:
        # Return raw content if JSON parsing fails
        return json.dumps({
            "status": "partial",
            "raw_content": content,
            "message": "Could not parse as JSON, returning raw content"
        })
