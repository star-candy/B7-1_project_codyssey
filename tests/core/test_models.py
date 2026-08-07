from core.models import User
from sqlalchemy import Column, Integer, String, DateTime

def test_user_model_attributes():
    assert hasattr(User, "id")
    assert hasattr(User, "username")
    assert hasattr(User, "hashed_password")
    assert hasattr(User, "created_at")
    assert User.__tablename__ == "users"
