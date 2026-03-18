import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { loginThunk } from '../features/auth/authSlice'
import { setLanguage, setTheme } from '../features/ui/uiSlice'
import cmcLogo from '../assets/cmc.png'

export default function LoginPage({ forcedPortal = null }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { loading, error, user, token } = useAppSelector((state) => state.auth)
  const language = useAppSelector((state) => state.ui.language)
  const theme = useAppSelector((state) => state.ui.theme)

  const [portal, setPortal] = useState(
    forcedPortal === 'admin' ? 'admin' : forcedPortal === 'monitor' ? 'monitor' : 'stagiaire',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langMenuRef = useRef(null)
  const firstVisit = t('firstVisit')
  const firstVisitParts = firstVisit.split(/[?؟]/)
  const firstVisitLead = firstVisitParts[0]?.trim() ?? firstVisit
  const firstVisitCta = firstVisitParts.slice(1).join(' ').trim()
  const questionMark = firstVisit.includes('؟') ? '؟' : '?'

  useEffect(() => {
    if (!token || !user) {
      return
    }

    if (user.role === 'admin') {
      navigate('/admin/dashboard')
      return
    }

    if (user.role === 'monitor') {
      navigate('/monitor/reservations')
      return
    }

    navigate('/stagiaire/reservations')
  }, [navigate, token, user])

  useEffect(() => {
    if (!forcedPortal) return
    setPortal(forcedPortal)
  }, [forcedPortal])

  const submit = async (e) => {
    e.preventDefault()
    await dispatch(loginThunk({ email: email.trim(), password, portal }))
  }

  const onLanguageChange = (lang) => {
    dispatch(setLanguage(lang))
    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    setLangOpen(false)
  }

  useEffect(() => {
    const onDocClick = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangOpen(false)
      }
    }

    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const langLabel = language === 'fr' ? 'Francais' : language === 'ar' ? 'Arabic' : 'English'
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1724] text-[#e7edf6]' : 'bg-[#f6f7f9] text-[#132738]'}`}>
      <main className={`min-h-screen grid place-items-center px-4 md:px-6 py-8 ${isDark ? 'bg-gradient-to-r from-[#101b2a] via-[#0f1724] to-[#101b2a]' : 'bg-gradient-to-r from-[#f4f5f7] via-[#f6f7f9] to-[#f4f5f7]'}`}>
        <section className="w-full max-w-[610px] grid gap-3">
          <div className={`w-full max-w-[460px] justify-self-center rounded-[14px] border px-4 py-3 flex items-center justify-between ${isDark ? 'bg-[#172334] border-[#2a3b52]' : 'bg-[#f0f1f3] border-[#d9e1e9]'}`}>
            <img src={cmcLogo} alt="CMC SportBooking" className="h-10 w-auto object-contain" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                title={theme === 'light' ? t('darkMode') : t('lightMode')}
                aria-label={theme === 'light' ? t('darkMode') : t('lightMode')}
                onClick={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))}
                className={`w-10 h-10 shrink-0 p-0 rounded-full border grid place-items-center transition-all duration-200 ${isDark ? 'border-[#35506d] bg-[#1a2c43] text-[#d7e5f2] hover:bg-[#223650]' : 'border-[#d9e3ec] bg-[#f7f9fc] text-[#6f8193] hover:bg-white'}`}
              >
                {theme === 'light' ? (
                  <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                )}
              </button>
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  title={langLabel}
                  aria-label={t('language')}
                  onClick={() => setLangOpen((v) => !v)}
                  className={`w-10 h-10 shrink-0 p-0 rounded-full border grid place-items-center transition-all duration-200 ${isDark ? 'border-[#35506d] bg-[#1a2c43] text-[#d7e5f2] hover:bg-[#223650]' : 'border-[#d9e3ec] bg-[#f7f9fc] text-[#6f8193] hover:bg-white'}`}
                >
                  <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
                  </svg>
                </button>
                {langOpen ? (
                  <div className={`absolute right-0 mt-2 w-36 rounded-[10px] border p-1 z-20 ${isDark ? 'bg-[#1b2b40] border-[#35506d]' : 'bg-white border-[#d4dce5]'}`}>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('fr')}
                      className={`w-full text-left px-3 py-2 rounded-[8px] text-sm ${language === 'fr' ? 'bg-[#7eb6de] text-[#122b3d] font-bold' : isDark ? 'text-[#dce8f4]' : 'text-[#3f556b]'}`}
                    >
                      Francais
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('en')}
                      className={`w-full text-left px-3 py-2 rounded-[8px] text-sm ${language === 'en' ? 'bg-[#7eb6de] text-[#122b3d] font-bold' : isDark ? 'text-[#dce8f4]' : 'text-[#3f556b]'}`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('ar')}
                      className={`w-full text-left px-3 py-2 rounded-[8px] text-sm ${language === 'ar' ? 'bg-[#7eb6de] text-[#122b3d] font-bold' : isDark ? 'text-[#dce8f4]' : 'text-[#3f556b]'}`}
                    >
                      Arabic
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

        <form
          onSubmit={submit}
          className={`w-full max-w-[460px] justify-self-center rounded-[10px] p-5 grid gap-2.5 border shadow-[0_24px_56px_-40px_#000] ${isDark ? 'bg-[#19283a] border-[#2d425b]' : 'bg-[#f2f3f5]/95 border-[#e1e7ee]'}`}
        >
          <h1 className={`m-0 text-center text-[38px] leading-[1.04] font-['Sora'] font-extrabold ${isDark ? 'text-[#ecf3ff]' : 'text-[#132738]'}`}>{t('welcomeBack')}</h1>
          <p className={`m-0 mx-auto text-center text-[16px] leading-[1.45] max-w-[290px] ${isDark ? 'text-[#9db2c8]' : 'text-[#6e7f91]'}`}>{t('accessReservation')}</p>

          {!forcedPortal ? (
            <div className={`mt-2 p-[3px] rounded-[8px] grid grid-cols-2 gap-[2px] ${isDark ? 'bg-[#24374e]' : 'bg-[#e1e4e8]'}`}>
              <button
                type="button"
                className={`rounded-[6px] px-2 py-[9px] text-sm font-['Sora'] font-bold ${portal === 'stagiaire' ? isDark ? 'bg-[#182739] text-[#e8f1fd] shadow-sm' : 'bg-[#f0f2f4] text-[#1b2e40] shadow-sm' : isDark ? 'bg-transparent text-[#9eb5cb]' : 'bg-transparent text-[#5f7183]'}`}
                onClick={() => setPortal('stagiaire')}
              >
                {t('studentLogin')}
              </button>
              <button
                type="button"
                className={`rounded-[6px] px-2 py-[9px] text-sm font-['Sora'] font-bold ${portal === 'admin' ? isDark ? 'bg-[#182739] text-[#e8f1fd] shadow-sm' : 'bg-[#f0f2f4] text-[#1b2e40] shadow-sm' : isDark ? 'bg-transparent text-[#9eb5cb]' : 'bg-transparent text-[#5f7183]'}`}
                onClick={() => setPortal('admin')}
              >
                {t('adminLogin')}
              </button>
            </div>
          ) : (
            <div className={`mt-2 rounded-[8px] border px-3 py-[10px] text-center text-sm font-['Sora'] font-bold ${isDark ? 'bg-[#1f3046] border-[#36506f] text-[#dce9f7]' : 'bg-[#e7edf3] border-[#d4dee8] text-[#1d3348]'}`}>
              {forcedPortal === 'admin' ? t('adminLogin') : forcedPortal === 'monitor' ? t('monitorLogin') : t('studentLogin')}
            </div>
          )}

          <label htmlFor="email" className={`font-bold text-sm mt-2 ${isDark ? 'text-[#d5e3f2]' : 'text-[#27384a]'}`}>{t('email')}</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8192a5]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M16 8v6a4 4 0 1 1-4-4h3" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('numberPlaceholder')}
              className={`w-full border rounded-[8px] pl-10 pr-[122px] py-2.5 text-[15px] outline-none ${isDark ? 'border-[#35506d] bg-[#142235] text-[#e5effa] focus:border-[#79b9de]' : 'border-[#d5dce5] bg-[#f0f2f5] text-[#22384d] focus:border-[#96b7d3]'}`}
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[12px] border rounded-[6px] px-2 py-1 font-semibold ${isDark ? 'text-[#a8bdd1] bg-[#21354b] border-[#35506d]' : 'text-[#8899ab] bg-[#e2e7ed] border-[#d1d8e0]'}`}>
              @gmail.com
            </span>
          </div>
          <small className={`text-[12px] leading-[1.4] ${isDark ? 'text-[#8aa2bb]' : 'text-[#8fa1b2]'}`}>{t('domainHint')}</small>

          <div className="flex items-center justify-between mt-1">
            <label htmlFor="password" className={`font-bold text-sm ${isDark ? 'text-[#d5e3f2]' : 'text-[#27384a]'}`}>{t('password')}</label>
            <button
              type="button"
              className="text-[#6fa6cf] text-[12px] bg-transparent border-0 p-0"
              onClick={() => navigate(`/forgot-password?portal=${portal}`)}
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a99ab]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full border rounded-[8px] pl-10 pr-11 py-2.5 text-[15px] outline-none ${isDark ? 'border-[#35506d] bg-[#142235] text-[#e5effa] focus:border-[#79b9de]' : 'border-[#d5dce5] bg-[#f0f2f5] text-[#22384d] focus:border-[#96b7d3]'}`}
            />
            {password ? (
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                  className={`absolute inset-y-0 right-3 flex items-center justify-center p-0 bg-transparent ${isDark ? 'text-[#9fb4c8]' : 'text-[#23384d]'}`}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c5.2 0 9.3 4.8 10 6-.4.7-1.8 2.8-4.2 4.5" />
                    <path d="M6.2 6.2C3.9 7.8 2.4 10 2 11c.6 1.2 4.7 6 10 6 1 0 2-.2 2.8-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            ) : null}
          </div>

          <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-[#93acc5]' : 'text-[#6f8295]'}`}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-[14px] h-[14px]" />
            {t('rememberMe')}
          </label>

          {error ? <p className="m-0 text-[#c23b56] text-sm">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-gradient-to-r from-[#72b2dc] to-[#79b9de] text-[#0f2538] rounded-[7px] py-[12px] font-['Sora'] font-extrabold text-[18px] shadow-[0_10px_24px_-18px_#1f6da4,0_10px_0_-7px_#bdeecf]"
          >
            <span className="inline-flex items-center gap-2">{loading ? '...' : t('signIn')} <span aria-hidden>→</span></span>
          </button>

          <div className={`mt-5 flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.12em] ${isDark ? 'text-[#8ea6bf]' : 'text-[#98a6b6]'}`}>
            <span className={`flex-1 border-b ${isDark ? 'border-[#385471]' : 'border-[#dbe4ec]'}`} />
            <span>{t('academicPortal')}</span>
            <span className={`flex-1 border-b ${isDark ? 'border-[#385471]' : 'border-[#dbe4ec]'}`} />
          </div>
          {portal === 'stagiaire' ? (
            <button
              type="button"
              onClick={() => navigate('/register')}
              className={`w-full rounded-[8px] py-[11px] border font-['Sora'] font-bold text-[15px] transition-colors ${isDark ? 'border-[#35506d] text-[#d9e7f5] hover:bg-[#1e3045]' : 'border-[#c8d7e6] text-[#2f4f6d] hover:bg-[#eaf3fb]'}`}
            >
              Create Account
            </button>
          ) : null}
          <p className={`m-0 text-center text-sm ${isDark ? 'text-[#8ea6bf]' : 'text-[#7f90a1]'}`}>
            <span>
              {firstVisitLead}
              {firstVisitCta ? `${questionMark} ` : ''}
            </span>
            <span className="text-[#57a7db] font-bold">{firstVisitCta}</span>
          </p>
        </form>
        </section>
      </main>
    </div>
  )
}
