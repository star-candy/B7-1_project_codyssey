from core.schemas import UserCreate, UserResponse, Token
from pydantic import ValidationError
import pytest
from datetime import datetime

def test_user_create_validation():
    # valid
    user = UserCreate(username="testuser", password="password123")
    assert user.username == "testuser"
    # invalid short username
    with pytest.raises(ValidationError):
        UserCreate(username="ab", password="password123")

def test_user_response_schema():
    response = UserResponse(id=1, username="testuser", created_at=datetime.now())
    assert response.id == 1

def test_token_schema():
    token = Token(access_token="eyJ...", token_type="bearer")
    assert token.token_type == "bearer"
