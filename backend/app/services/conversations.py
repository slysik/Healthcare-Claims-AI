"""Conversation persistence: InMemory (default) or DynamoDB (optional)."""

import logging
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ConversationStore(ABC):
    """Abstract conversation store interface."""

    @abstractmethod
    def save_message(self, conversation_id: str, role: str, content: str,
                     response_data: dict | None = None) -> None:
        """Save a message to a conversation."""
        ...

    @abstractmethod
    def get_history(self, conversation_id: str, limit: int = 50) -> list[dict]:
        """Get conversation history, newest last."""
        ...

    @abstractmethod
    def list_conversations(self) -> list[dict]:
        """List all conversations with metadata."""
        ...

    @abstractmethod
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation. Returns True if found."""
        ...

    @staticmethod
    def new_id() -> str:
        """Generate a new conversation ID."""
        return str(uuid.uuid4())


class InMemoryStore(ConversationStore):
    """Dict-based in-memory conversation store. Default."""

    def __init__(self):
        self._conversations: dict[str, list[dict]] = {}

    def save_message(self, conversation_id: str, role: str, content: str,
                     response_data: dict | None = None) -> None:
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if response_data:
            message["response_data"] = response_data

        self._conversations[conversation_id].append(message)

    def get_history(self, conversation_id: str, limit: int = 50) -> list[dict]:
        messages = self._conversations.get(conversation_id, [])
        return messages[-limit:]

    def list_conversations(self) -> list[dict]:
        result = []
        for conv_id, messages in self._conversations.items():
            if messages:
                result.append({
                    "conversation_id": conv_id,
                    "message_count": len(messages),
                    "last_message": messages[-1].get("timestamp", ""),
                    "preview": messages[-1].get("content", "")[:100],
                })
        return sorted(result, key=lambda x: x["last_message"], reverse=True)

    def delete_conversation(self, conversation_id: str) -> bool:
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
            return True
        return False


class DynamoDBStore(ConversationStore):
    """DynamoDB-backed conversation store. Optional."""

    def __init__(self, table_name: str, region: str = "us-east-1"):
        try:
            import boto3
        except ImportError:
            raise RuntimeError(
                "boto3 not installed. Install with: pip install '.[aws]'"
            )

        self._client = boto3.resource("dynamodb", region_name=region)
        self._table = self._client.Table(table_name)
        logger.info(f"DynamoDB store initialized: {table_name}")

    def save_message(self, conversation_id: str, role: str, content: str,
                     response_data: dict | None = None) -> None:
        item = {
            "conversation_id": conversation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "role": role,
            "content": content,
        }
        if response_data:
            # DynamoDB doesn't support None values or empty strings in some cases
            import json
            item["response_data"] = json.dumps(response_data)

        self._table.put_item(Item=item)

    def get_history(self, conversation_id: str, limit: int = 50) -> list[dict]:
        from boto3.dynamodb.conditions import Key

        response = self._table.query(
            KeyConditionExpression=Key("conversation_id").eq(conversation_id),
            ScanIndexForward=True,  # oldest first
            Limit=limit,
        )

        messages = []
        for item in response.get("Items", []):
            msg = {
                "role": item["role"],
                "content": item["content"],
                "timestamp": item["timestamp"],
            }
            if "response_data" in item:
                import json
                msg["response_data"] = json.loads(item["response_data"])
            messages.append(msg)

        return messages

    def list_conversations(self) -> list[dict]:
        # Scan is expensive but acceptable for demo
        response = self._table.scan(
            ProjectionExpression="conversation_id, #ts, content, #r",
            ExpressionAttributeNames={"#ts": "timestamp", "#r": "role"},
        )

        # Group by conversation_id
        convos: dict[str, list] = {}
        for item in response.get("Items", []):
            cid = item["conversation_id"]
            if cid not in convos:
                convos[cid] = []
            convos[cid].append(item)

        result = []
        for conv_id, messages in convos.items():
            messages.sort(key=lambda x: x.get("timestamp", ""))
            last = messages[-1]
            result.append({
                "conversation_id": conv_id,
                "message_count": len(messages),
                "last_message": last.get("timestamp", ""),
                "preview": last.get("content", "")[:100],
            })

        return sorted(result, key=lambda x: x["last_message"], reverse=True)

    def delete_conversation(self, conversation_id: str) -> bool:
        from boto3.dynamodb.conditions import Key

        response = self._table.query(
            KeyConditionExpression=Key("conversation_id").eq(conversation_id),
            ProjectionExpression="conversation_id, #ts",
            ExpressionAttributeNames={"#ts": "timestamp"},
        )

        items = response.get("Items", [])
        if not items:
            return False

        with self._table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={
                    "conversation_id": item["conversation_id"],
                    "timestamp": item["timestamp"],
                })

        return True


def get_store() -> ConversationStore:
    """Factory: returns DynamoDB store if AWS enabled, else in-memory."""
    from app.config import settings

    if settings.ENABLE_AWS and settings.DYNAMODB_TABLE:
        try:
            return DynamoDBStore(
                table_name=settings.DYNAMODB_TABLE,
                region=settings.AWS_REGION,
            )
        except Exception as e:
            logger.warning(f"DynamoDB unavailable, falling back to in-memory: {e}")

    logger.info("Using in-memory conversation store")
    return InMemoryStore()


# Singleton instance
conversation_store = get_store()
