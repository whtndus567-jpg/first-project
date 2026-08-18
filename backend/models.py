from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from database import Base

# 🔥 한국 시간(KST, UTC+9) 반환 함수
def current_kst():
    kst = timezone(timedelta(hours=9))
    return datetime.now(kst)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    nickname = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_kst)

    posts = relationship("Post", back_populates="author_user")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    likes_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    is_notice = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=current_kst)
    updated_at = Column(DateTime(timezone=True), default=current_kst, onupdate=current_kst)

    author_user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    # 🔥 댓글 개수를 자동으로 계산해 주는 속성
    @property
    def comments_count(self):
        return len(self.comments) if self.comments else 0

    # 🔥 HOT 게시글 판별 속성 (조회수 10회 이상 OR 좋아요 5개 이상)
    @property
    def is_hot(self):
        return self.views_count >= 10 or self.likes_count >= 5

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author = Column(String, default="익명") 
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_kst)

    post = relationship("Post", back_populates="comments")
    author_user = relationship("User")
    replies = relationship("Comment", backref=backref("parent", remote_side=[id]), cascade="all, delete-orphan")