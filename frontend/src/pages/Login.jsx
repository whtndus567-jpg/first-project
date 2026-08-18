import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [capsLockActive, setCapsLockActive] = useState(false)
  
  const navigate = useNavigate()

  // 아이디 입력 핸들러 (실시간 한글 체크)
  const handleUsernameChange = (e) => {
    const val = e.target.value
    setUsername(val)

    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
    if (koreanRegex.test(val)) {
      setUsernameError('아이디와 비밀번호에는 영문, 숫자, 특수문자만 입력할 수 있어요.')
    } else {
      setUsernameError('')
    }
  }

  // 비밀번호 입력 및 Caps Lock 감지 핸들러
  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  const handleKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      return alert('아이디와 비밀번호를 모두 입력해 주세요.')
    }

    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
    if (koreanRegex.test(username)) {
      return alert('아이디에는 한글을 사용할 수 없습니다.')
    }

    try {
      // 💡 백엔드 포트(8000)를 명시하여 404 에러 방지
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      })

      if (res.ok) {
        const data = await res.json()
        
        const token = data.access_token || data.accessToken || data.token
        const userData = data.user || data.userData || { nickname: username }

        if (!token) {
          return alert('로그인 토큰을 받지 못했습니다. 서버 응답을 확인하세요.')
        }

        // 로컬 스토리지 저장
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))

        // App.jsx 상태 실시간 업데이트
        if (onLoginSuccess) {
          onLoginSuccess(userData)
        }
        
        alert('로그인되었습니다!')
        navigate('/')
      } else {
        const errData = await res.json()
        alert(errData.detail || '로그인 실패')
      }
    } catch (err) {
      console.error("로그인 오류:", err)
      alert('로그인 처리 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-slate-100">
      <h2 className="text-2xl font-bold text-center text-indigo-400 mb-6">🔑 로그인</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">아이디</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="아이디 입력"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
          {usernameError && (
            <p className="mt-1.5 text-xs text-rose-400 font-medium">{usernameError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="비밀번호 입력"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
          {capsLockActive && (
            <p className="mt-1.5 text-xs text-amber-400 font-medium">
              키보드 왼쪽 대문자 고정(Caps Look)이 켜져 있어요 비밀번호를 확인하세요.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-md transition"
        >
          로그인
        </button>
      </form>
    </div>
  )
}