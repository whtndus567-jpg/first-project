from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# ----------------------------------------------------
# User 스키마
# ----------------------------------------------------
class UserCreate(BaseModel):
    username: str
    password: str
    nickname: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    nickname: str

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Comment 스키마
# ----------------------------------------------------
class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    post_id: int
    parent_id: Optional[int] = None
    user_id: Optional[int] = None
    author: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Post 스키마
# ----------------------------------------------------
class PostCreate(BaseModel):
    title: str
    content: str
    is_notice: bool = False

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_notice: Optional[bool] = None

class PostListResponse(BaseModel):
    id: int
    title: str
    is_notice: bool
    created_at: datetime
    views_count: int
    likes_count: int
    comments_count: int

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    is_notice: bool
    created_at: datetime
    views_count: int
    likes_count: int
    comments_count: int = 0
    user_id: Optional[int] = None
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True