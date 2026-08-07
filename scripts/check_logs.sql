-- 모든 사용자 목록 조회
SELECT id, username, created_at FROM users;

-- 최근 채팅 로그 조회 (최신 10건)
SELECT 
    c.id, 
    u.username, 
    c.user_message, 
    c.ai_response, 
    c.error_status, 
    c.created_at 
FROM chat_logs c
JOIN users u ON c.user_id = u.id
ORDER BY c.id DESC
LIMIT 10;
