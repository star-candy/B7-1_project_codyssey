import os
from core.config import Settings

def test_settings_default_values():
    settings = Settings(
        gemini_api_key="test_key",
        secret_key="test_secret",
        algorithm="HS256",
        access_token_expire_minutes=15
    )
    assert settings.app_name == "Codyssey AI Chatbot"
    assert settings.database_url == "sqlite:///./chatbot.db"
    assert settings.ai_timeout_seconds == 10
