import bcrypt

def get_password_hash(password: str) -> str:
    """비밀번호를 bcrypt 알고리즘을 사용해 암호화(단방향 해시)하여 반환합니다."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """사용자가 입력한 비밀번호와 DB에 저장된 암호화된 비밀번호가 일치하는지 검증합니다."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False