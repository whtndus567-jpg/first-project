import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const [isUsernameChecked, setIsUsernameChecked] = useState(false)
  const [isNicknameChecked, setIsNicknameChecked] = useState(false)
  const [usernameMsg, setUsernameMsg] = useState('')
  const [nicknameMsg, setNicknameMsg] = useState('')

  // 🔥 아이디 대문자 감지 상태 추가
  const [hasUppercase, setHasUppercase] = useState(false)

  const navigate = useNavigate()

  // 아이디 입력 및 대문자 감지/소문자 자동 변환
  const handleUsernameChange = (e) => {
    const rawVal = e.target.value

    // 대문자가 포함되어 있는지 검사
    if (/[A-Z]/.test(rawVal)) {
      setHasUppercase(true)
    } else {
      setHasUppercase(false)
    }

    // 소문자로 자동 변환하여 저장
    setUsername(rawVal.toLowerCase())
    setIsUsernameChecked(false)
    setUsernameMsg('')
  }

  // 아이디 중복 확인
  const handleCheckUsername = async () => {
    if (!username.trim()) return alert('아이디를 입력해 주세요.')
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      if (data.available) {
        setIsUsernameChecked(true)
        setUsernameMsg('✅ 사용 가능한 아이디입니다.')
      } else {
        setIsUsernameChecked(false)
        setUsernameMsg('❌ 이미 존재하는 아이디입니다.')
      }
    } catch (err) {
      alert('아이디 중복 확인 중 오류가 발생했습니다.')
    }
  }

  // 닉네임 중복 확인
  const handleCheckNickname = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해 주세요.')
    try {
      const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`)
      const data = await res.json()
      if (data.available) {
        setIsNicknameChecked(true)
        setNicknameMsg('✅ 사용 가능한 닉네임입니다.')
      } else {
        setIsNicknameChecked(false)
        setNicknameMsg('❌ 이미 존재하는 닉네임입니다.')
      }
    } catch (err) {
      alert('닉네임 중복 확인 중 오류가 발생했습니다.')
    }
  }

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isUsernameChecked) return alert('아이디 중복 확인을 진행해 주세요.')
    if (!isNicknameChecked) return alert('닉네임 중복 확인을 진행해 주세요.')
    if (password !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.')
    if (password.length < 4) return alert('비밀번호는 최소 4자 이상이어야 합니다.')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname }),
      })

      if (res.ok) {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.')
        navigate('/login')
      } else {
        const errData = await res.json()
        alert(errData.detail || '회원가입 실패')
      }
    } catch (err) {
      alert('회원가입 처리 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-center text-indigo-400 mb-6">📝 회원가입</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아이디 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">아이디</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="아이디 입력"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="button"
              onClick={handleCheckUsername}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 rounded-lg transition"
            >
              중복확인
            </button>
          </div>

          {/* 🔥 대문자 감지 안내 문구 */}
          {hasUppercase && (
            <p className="text-xs text-amber-400 mt-1">
              * 아이디는 소문자로 자동 변환됩니다.
            </p>
          )}

          {usernameMsg && (
            <p className={`text-xs mt-1 ${isUsernameChecked ? 'text-emerald-400' : 'text-rose-400'}`}>
              {usernameMsg}
            </p>
          )}
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">닉네임</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setIsNicknameChecked(false)
                setNicknameMsg('')
              }}
              placeholder="닉네임 입력"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="button"
              onClick={handleCheckNickname}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 rounded-lg transition"
            >
              중복확인
            </button>
          </div>
          {nicknameMsg && (
            <p className={`text-xs mt-1 ${isNicknameChecked ? 'text-emerald-400' : 'text-rose-400'}`}>
              {nicknameMsg}
            </p>
          )}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력 (4자 이상)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호 재입력"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-rose-400 mt-1">❌ 비밀번호가 일치하지 않습니다.</p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p className="text-xs text-emerald-400 mt-1">✅ 비밀번호가 일치합니다.</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-md transition"
        >
          회원가입 완료
        </button>
      </form>
    </div>
  )
}