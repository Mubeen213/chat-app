from typing import Dict, Any

class ConversationManager:
    """
    Manages the state of the conversation for a user session.
    """
    sessions: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def get_session(session_id: str) -> Dict[str, Any]:
        """
        Retrieve or initialize a session by session_id.
        """
        if session_id not in ConversationManager.sessions:
            ConversationManager.sessions[session_id] = {"context": {}}
        return ConversationManager.sessions[session_id]

    @staticmethod
    def update_context(session_id: str, key: str, value: Any):
        """
        Update the context of a session.
        """
        session = ConversationManager.get_session(session_id)
        session["context"][key] = value

    @staticmethod
    def get_context(session_id: str, key: str) -> Any:
        """
        Retrieve a specific context value for a session.
        """
        session = ConversationManager.get_session(session_id)
        return session["context"].get(key)