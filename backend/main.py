from typing import List
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func

from database import engine, Base, get_db
import models
from models import User, Post, Comment
import schemas
from schemas import (
    UserCreate, UserLogin, UserResponse,
    PostCreate, PostUpdate, PostResponse, PostListResponse,
    CommentCreate, CommentResponse
)
from security import hash_password, verify_password, create_access_token, get_current_user

# 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Board API")

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Auth API
# ----------------------------------------------------
@app.get("/api/auth/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    normalized_username = username.lower()
    user = db.query(User).filter(User.username == normalized_username).first()
    return {"available": user is None}

@app.get("/api/auth/check-nickname")
def check_nickname(nickname: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.nickname == nickname).first()
    return {"available": user is None}

@app.post("/api/auth/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    normalized_username = user_data.username.lower()
    if db.query(User).filter(User.username == normalized_username).first():
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    if db.query(User).filter(User.nickname == user_data.nickname).first():
        raise HTTPException(status_code=400, detail="이미 존재하는 닉네임입니다.")
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        username=normalized_username,
        password_hash=hashed_pwd,
        nickname=user_data.nickname
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    normalized_username = login_data.username.lower()
    user = db.query(User).filter(User.username == normalized_username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    
    token = create_access_token(data={"sub": user.username, "nickname": user.nickname, "user_id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "nickname": user.nickname}
    }

# ----------------------------------------------------
# 게시글 API
# ----------------------------------------------------

# 1. 목록 조회 (공지사항 상단 배치 반영)
@app.get("/api/posts", response_model=List[PostListResponse])
def get_posts(db: Session = Depends(get_db)):
    results = (
        db.query(
            Post,
            func.count(Comment.id).label("comments_count")
        )
        .outerjoin(Comment, Post.id == Comment.post_id)
        .group_by(Post.id)
        .order_by(Post.is_notice.desc(), Post.id.desc())
        .all()
    )
    
    posts_list = []
    for post, comments_count in results:
        posts_list.append({
            "id": post.id,
            "title": post.title,
            "is_notice": post.is_notice,
            "is_hot": post.is_hot,  # 🔥 HOT 여부 포함
            "created_at": post.created_at,
            "views_count": post.views_count,
            "likes_count": post.likes_count,
            "comments_count": comments_count
        })
        
    return posts_list

# 2. 게시글 상세 조회
@app.get("/api/posts/{post_id}", response_model=PostResponse)
def get_post_detail(post_id: int, db: Session = Depends(get_db)):
    db_post = db.query(Post).options(selectinload(Post.comments)).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    # 조회수 증가
    db_post.views_count += 1
    db.commit()
    db.refresh(db_post)
    return db_post

# 3. 게시글 작성
@app.post("/api/posts", response_model=PostResponse)
def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = Post(
        title=post_data.title, 
        content=post_data.content, 
        is_notice=post_data.is_notice,
        user_id=current_user.id
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

# 4. 게시글 수정
@app.put("/api/posts/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post_data: PostUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if db_post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    
    if post_data.title is not None:
        db_post.title = post_data.title
    if post_data.content is not None:
        db_post.content = post_data.content
    if post_data.is_notice is not None:
        db_post.is_notice = post_data.is_notice

    if hasattr(db_post, 'updated_at'):
        db_post.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_post)
    return db_post

# 5. 게시글 삭제 API
@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if db_post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    db.delete(db_post)
    db.commit()
    return {"message": "게시글이 삭제되었습니다."}
    
# 6. 좋아요
@app.post("/api/posts/{post_id}/like")
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    db_post.likes_count += 1
    db.commit()
    return {"likes_count": db_post.likes_count, "is_hot": db_post.is_hot}

# 7. 댓글 작성
@app.post("/api/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(post_id: int, comment_data: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    db_comment = Comment(
        post_id=post_id, 
        parent_id=comment_data.parent_id,
        user_id=current_user.id, 
        author=current_user.nickname, 
        content=comment_data.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# 8. 내 작성글 조회
@app.get("/api/users/me/posts", response_model=List[PostResponse])
def get_my_posts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Post).filter(Post.user_id == current_user.id).order_by(Post.id.desc()).all()

# 9. 댓글 수정
@app.put("/api/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int, 
    comment_data: CommentCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    
    author_id = getattr(db_comment, 'author_id', getattr(db_comment, 'user_id', None))
    if author_id and author_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    
    if not author_id and db_comment.author != current_user.nickname:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    if comment_data.content is not None:
        db_comment.content = comment_data.content

    db.commit()
    db.refresh(db_comment)
    return db_comment

# 10. 댓글 삭제
@app.delete("/api/comments/{comment_id}")
def delete_comment(
    comment_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    
    author_id = getattr(db_comment, 'author_id', getattr(db_comment, 'user_id', None))
    if author_id and author_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    if not author_id and db_comment.author != current_user.nickname:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

    db.delete(db_comment)
    db.commit()
    return {"message": "댓글이 삭제되었습니다."}