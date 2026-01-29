"""Chat API endpoint for agent interaction."""
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.models.database import get_db
from app.services.template_service import GenerationService
from app.schemas.chat import ChatRequest, ChatResponse, GenerationStatusEnum
from app.agent import AgentExecutor

logger = logging.getLogger(__name__)
router = APIRouter()

# Store conversation history (in production, use Redis or database)
_conversations: dict[str, list[dict]] = {}


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the design generation agent.

    The agent will:
    1. Understand your design request
    2. Search for suitable templates
    3. Generate appropriate content
    4. Create the final design

    Example requests:
    - "اعملي بوست عرض قهوة تركية خصم 30%"
    - "Create an Instagram story for a new product launch"
    """
    # Get or create conversation
    conversation_id = request.conversation_id or str(uuid4())

    # Get conversation history
    history = _conversations.get(conversation_id, [])

    # Create agent executor
    executor = AgentExecutor()

    # Run agent
    result = await executor.run(
        message=request.message,
        conversation_history=history,
        language=request.language,
    )

    # Update conversation history
    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": result["message"]})
    _conversations[conversation_id] = history

    # Create generation record if output was created
    generation_id = None
    if result.get("output_url"):
        service = GenerationService(db)
        generation = await service.create(
            template_id=result.get("template_used", {}).get("id") if result.get("template_used") else None,
            user_prompt=request.message,
            replacements=None,
        )
        await service.update_status(
            generation_id=generation.id,
            status="completed",
            output_path=result["output_url"],
        )
        generation_id = generation.id

    return ChatResponse(
        message=result["message"],
        conversation_id=conversation_id,
        generation_id=generation_id,
        output_url=result.get("output_url"),
        template_used=result.get("template_used"),
        status=GenerationStatusEnum.COMPLETED if result.get("success") else GenerationStatusEnum.FAILED,
    )


@router.delete("/conversations/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """Clear conversation history."""
    if conversation_id in _conversations:
        del _conversations[conversation_id]
        return {"message": "Conversation cleared"}
    raise HTTPException(status_code=404, detail="Conversation not found")
