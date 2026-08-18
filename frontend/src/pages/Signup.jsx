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

  // 🔥 아이디 한글 및 유효성 상태
  const [usernameError, setUsernameError] = useState('')
  const [hasUppercase, setHasUppercase] = useState(false)

  // 🔥 비밀번호 유효성 및 Caps Lock 상태
  const [passwordError, setPasswordError] = useState('')
  const [capsLockActive, setCapsLockActive] = useState(false)

  const navigate = useNavigate()

  // 1. 아이디 입력 및 실시간 유효성 검사 (한글 차단)
  const handleUsernameChange = (e) => {
    const rawVal = e.target.value

    // 한글 포함 여부 검사
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
    if (koreanRegex.test(rawVal)) {
      setUsernameError('아이디와 비밀번호에는 영문, 숫자, 특수문자만 입력할 수 있어요.')
    } else {
      setUsernameError('')
    }

    // 대문자 포함 여부 검사
    if (/[A-Z]/.test(rawVal)) {
      setHasUppercase(true)
    } else {
      setHasUppercase(false)
    }

    setUsername(rawVal.toLowerCase())
    setIsUsernameChecked(false)
    setUsernameMsg('')
  }

  // 2. 비밀번호 입력 및 실시간 유효성 검사 (4자 이상, 영문, 특수문자 필수)
  const handlePasswordChange = (e) => {
    const val = e.target.value
    setPassword(val)

    if (!val) {
      setPasswordError('')
      return
    }

    const hasMinLen = val.length >= 4
    const hasLetter = /[a-zA-Z]/.test(val)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)

    if (!hasMinLen || !hasLetter || !hasSpecial) {
      setPasswordError('비밀번호는 4자리 이상이며 영문과 특수문자를 모두 포함해야 합니다.')
    } else {
      setPasswordError('')
    }
  }

  // Caps Lock 감지
  const handlePasswordKeyDown = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  const handlePasswordKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  // 3. 아이디 중복 확인 (한글이 있거나 유효하지 않으면 동작 차단!)
  const handleCheckUsername = async () => {
    if (!username.trim()) return alert('아이디를 입력해 주세요.')

    // ⛔ 한글 포함 등 유효성 에러가 있는 경우 중복확인 차단
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
    if (koreanRegex.test(username) || usernameError) {
      return alert('아이디와 비밀번호에는 영문, 숫자, 특수문자만 입력할 수 있어요.')
    }

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

  // 4. 닉네임 중복 확인
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

  // 5. 회원가입 제출 (조건 미달시 차단)
  const handleSubmit = async (e) => {
    e.preventDefault()

    // ⛔ 아이디 유효성 검사
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
    if (koreanRegex.test(username) || usernameError) {
      return alert('아이디와 비밀번호에는 영문, 숫자, 특수문자만 입력할 수 있어요.')
    }

    if (!isUsernameChecked) return alert('아이디 중복 확인을 진행해 주세요.')
    if (!isNicknameChecked) return alert('닉네임 중복 확인을 진행해 주세요.')

    // ⛔ 비밀번호 유효성 검사 (4자 이상, 영문, 특수문자)
    const hasMinLen = password.length >= 4
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    if (!hasMinLen || !hasLetter || !hasSpecial) {
      return alert('비밀번호는 4자리 이상이며 영문과 특수문자를 모두 포함해야 합니다.')
    }

    if (password !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.')

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

          {/* 🔥 아이디 한글 포함 시 경고 메시지 */}
          {usernameError && (
            <p className="text-xs text-rose-400 mt-1.5 font-medium">{usernameError}</p>
          )}

          {/* 대문자 감지 안내 문구 */}
          {hasUppercase && !usernameError && (
            <p className="text-xs text-amber-400 mt-1">
              * 아이디는 소문자로 자동 변환됩니다.
            </p>
          )}

          {/* 중복확인 결과 메시지 (한글 에러가 없을 때만 표시) */}
          {usernameMsg && !usernameError && (
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
            onChange={handlePasswordChange}
            onKeyDown={handlePasswordKeyDown}
            onKeyUp={handlePasswordKeyUp}
            placeholder="비밀번호 입력 (4자 이상, 영문+특수문자 포함)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />

          {/* 🔥 비밀번호 미달 조건(4자리 이상, 영문, 특수문자) 실시간 경고 */}
          {passwordError && (
            <p className="text-xs text-rose-400 mt-1.5 font-medium">{passwordError}</p>
          )}

          {/* 🔥 Caps Lock 안내 문구 */}
          {capsLockActive && (
            <p className="text-xs text-amber-400 mt-1 font-medium">
              키보드 왼쪽 대문자 고정(Caps Look)이 켜져 있어요 비밀번호를 확인하세요.
            </p>
          )}
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