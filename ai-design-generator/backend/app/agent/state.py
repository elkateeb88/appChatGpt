"""Agent state definition."""
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """State for the design generation agent."""

    # Conversation history with message accumulation
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Selected template information
    selected_template: dict | None

    # Generated content for text layers
    generated_content: dict | None

    # Path to generated image (if image generation was used)
    generated_image: str | None

    # Final output path
    output_path: str | None

    # User's original language preference
    language: str

    # Generation ID for tracking
    generation_id: str | None

    # Error message if any
    error: str | None
