"""LLM factory for agent nodes."""

from app.config import settings


def get_llm(streaming: bool = False):
    """
    Get LLM instance based on configured provider.

    Args:
        streaming: Whether to enable streaming responses

    Returns:
        LangChain chat model instance

    Raises:
        RuntimeError: If bedrock provider selected but langchain_aws not installed
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "bedrock":
        try:
            from langchain_aws import ChatBedrock

            return ChatBedrock(
                model_id=settings.BEDROCK_MODEL_ID,
                region_name=settings.AWS_REGION,
                streaming=streaming,
            )
        except ImportError as e:
            raise RuntimeError(
                "Bedrock provider requires langchain_aws. "
                "Install with: uv pip install langchain-aws boto3"
            ) from e

    # Default to anthropic
    from langchain_anthropic import ChatAnthropic

    kwargs = {
        "model": settings.ANTHROPIC_MODEL_ID,
        "streaming": streaming,
    }
    if settings.ANTHROPIC_API_KEY:
        kwargs["api_key"] = settings.ANTHROPIC_API_KEY

    return ChatAnthropic(**kwargs)
