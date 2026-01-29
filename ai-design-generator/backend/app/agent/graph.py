"""LangGraph agent for design generation."""
from typing import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import logging

from app.config import get_settings
from .state import AgentState
from .tools import (
    search_templates_tool,
    generate_content_tool,
    generate_image_tool,
    edit_psd_tool,
)

settings = get_settings()
logger = logging.getLogger(__name__)

# System prompt for the agent
SYSTEM_PROMPT = """أنت مساعد تصميم ذكي متخصص في إنشاء تصاميم سوشيال ميديا.

مهمتك:
1. فهم طلب المستخدم لإنشاء تصميم
2. البحث عن template مناسب من المكتبة
3. توليد نصوص إبداعية للتصميم
4. تعديل الـ PSD وإخراج الصورة النهائية

الأدوات المتاحة:
- search_templates_tool: للبحث عن templates في المكتبة
- generate_content_tool: لتوليد نصوص للطبقات
- generate_image_tool: لتوليد صور (استخدمها فقط إذا طلب المستخدم صورة مخصصة)
- edit_psd_tool: لتعديل التصميم وإخراج PNG

خطوات العمل:
1. ابحث عن template مناسب أولاً
2. حلل طبقات النص في الـ template
3. ولّد محتوى مناسب لكل طبقة
4. عدّل الـ PSD وارجع الصورة

كن ودوداً ومختصراً في ردودك. تحدث بالعربية."""


def create_agent():
    """Create and compile the design generation agent."""

    # Define tools
    tools = [
        search_templates_tool,
        generate_content_tool,
        generate_image_tool,
        edit_psd_tool,
    ]

    # Create model with tools
    model = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.openai_api_key,
        temperature=0.7,
    ).bind_tools(tools)

    # Create tool node
    tool_node = ToolNode(tools)

    async def call_model(state: AgentState) -> dict:
        """Call the model to decide next action."""
        messages = list(state["messages"])

        # Add system message if not present
        if not messages or not isinstance(messages[0], SystemMessage):
            messages.insert(0, SystemMessage(content=SYSTEM_PROMPT))

        # Call model
        response = await model.ainvoke(messages)

        return {"messages": [response]}

    def should_continue(state: AgentState) -> Literal["tools", "end"]:
        """Determine if we should continue to tools or end."""
        messages = state["messages"]
        last_message = messages[-1]

        # If the model wants to use tools, continue to tools
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"

        # Otherwise, end
        return "end"

    # Build the graph
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)

    # Set entry point
    graph.set_entry_point("agent")

    # Add conditional edges
    graph.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END,
        }
    )

    # Add edge from tools back to agent
    graph.add_edge("tools", "agent")

    # Compile and return
    return graph.compile()


class AgentExecutor:
    """Executor for running the design agent."""

    def __init__(self):
        """Initialize the agent executor."""
        self.agent = create_agent()

    async def run(
        self,
        message: str,
        conversation_history: list[dict] | None = None,
        language: str = "ar",
    ) -> dict:
        """Run the agent with a user message.

        Args:
            message: User's message/request
            conversation_history: Previous messages in the conversation
            language: Preferred language

        Returns:
            Dictionary with agent response and any generated outputs
        """
        # Build messages
        messages = []

        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))
                elif role == "assistant":
                    messages.append(AIMessage(content=content))

        # Add current message
        messages.append(HumanMessage(content=message))

        # Initial state
        initial_state: AgentState = {
            "messages": messages,
            "selected_template": None,
            "generated_content": None,
            "generated_image": None,
            "output_path": None,
            "language": language,
            "generation_id": None,
            "error": None,
        }

        # Run agent
        try:
            result = await self.agent.ainvoke(initial_state)

            # Extract response
            response_messages = result.get("messages", [])
            last_message = response_messages[-1] if response_messages else None

            response_text = ""
            if last_message:
                if hasattr(last_message, "content"):
                    response_text = last_message.content

            # Check for output in tool results
            output_url = None
            template_used = None

            for msg in response_messages:
                if hasattr(msg, "content") and isinstance(msg.content, str):
                    # Check if this is a tool result with output
                    if "output_path" in msg.content or "download_url" in msg.content:
                        try:
                            import json
                            data = json.loads(msg.content)
                            if data.get("status") == "success":
                                output_url = data.get("download_url")
                                template_used = data.get("template_used")
                        except (json.JSONDecodeError, TypeError):
                            pass

            return {
                "message": response_text,
                "output_url": output_url,
                "template_used": template_used,
                "success": True,
            }

        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            return {
                "message": f"عذراً، حدث خطأ أثناء معالجة طلبك: {str(e)}",
                "output_url": None,
                "template_used": None,
                "success": False,
            }
