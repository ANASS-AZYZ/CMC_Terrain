import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logoutThunk } from '../features/auth/authSlice'
import { setLanguage, setTheme } from '../features/ui/uiSlice'

function NavIcon({ type }) {
  if (type === 'grid') {
    return (
      <svg viewBox="0 0 24 24" className="admin-nav-svg" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="4" y="4" width="6" height="6" rx="1.2" />
        <rect x="14" y="4" width="6" height="6" rx="1.2" />
        <rect x="4" y="14" width="6" height="6" rx="1.2" />
        <rect x="14" y="14" width="6" height="6" rx="1.2" />
      </svg>
    )
  }

  if (type === 'terrain') {
    return (
      <svg viewBox="0 0 24 24" className="admin-nav-svg" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M5 5v14" />
        <path d="M19 5v14" />
        <path d="M5 5c3.5 2.2 6.5 2.2 9.8 0 1.3-.8 2.8-.8 4.2 0" />
        <path d="M5 12c3.5 2.2 6.5 2.2 9.8 0 1.3-.8 2.8-.8 4.2 0" />
      </svg>
    )
  }

  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" className="admin-nav-svg" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  }

  if (type === 'megaphone') {
    return (
      <svg viewBox="0 0 24 24" className="admin-nav-svg" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M4 12h4l8-4v8l-8-4H4z" />
        <path d="M9 14l1.2 4" />
        <path d="M18 10c1.4 1.3 1.4 2.7 0 4" />
      </svg>
    )
  }

  if (type === 'gear') {
    return (
      <svg viewBox="0 0 24 24" className="admin-nav-svg" fill="none" stroke="currentColor" strokeWidth="1.9">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V21a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H8a1 1 0 0 0 .6-.9V3a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V8c0 .4.2.8.6.9H21a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
      </svg>
    )
  }

  if (type === 'users') {
    return (
      <svg viewBox="0 0 24 24" className="admin-nav-svg" fill="none" stroke="currentColor" strokeWidth="1.9">
        <circle cx="9" cy="9" r="3" />
        <path d="M4 19c.5-3 2.4-5 5-5s4.5 2 5 5" />
        <path d="M17 8a2.5 2.5 0 0 1 0 5" />
        <path d="M19.5 19c-.2-1.7-1-3.1-2.2-4" />
      </svg>
    )
  }

  return null
}

export default function ShellLayout() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const theme = useAppSelector((state) => state.ui.theme)
  const language = useAppSelector((state) => state.ui.language)
  const isAdmin = user?.role === 'admin'
  const isMonitor = user?.role === 'monitor'
  const [openLangMenu, setOpenLangMenu] = useState(false)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const langMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  const primaryLinks = isAdmin
    ? [{ to: '/admin/dashboard', label: t('dashboard'), icon: 'grid' }]
    : isMonitor
      ? [{ to: '/monitor/reservations', label: t('manageReservations'), icon: 'grid' }]
    : [
        { to: '/stagiaire/home', label: t('home'), icon: 'calendar' },
        { to: '/stagiaire/my-reservations', label: t('myReservations'), icon: 'grid' },
        { to: '/stagiaire/contact-support', label: t('contactSupport'), icon: 'megaphone' },
      ]

  const resourcesLinks = isAdmin
    ? [
        { to: '/admin/terrains', label: t('manageTerrains'), icon: 'users' },
        { to: '/admin/reservations', label: t('manageReservations'), icon: 'terrain' },
        { to: '/admin/stagiaires', label: t('manageStagiaires'), icon: 'megaphone' },
        { to: '/admin/monitors', label: t('manageMonitors'), icon: 'users' },
      ]
    : []

  const onLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/login')
  }

  const onLanguageChange = (lang) => {
    dispatch(setLanguage(lang))
    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  useEffect(() => {
    const onDocClick = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setOpenLangMenu(false)
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUserMenu(false)
      }
    }

    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  const isDashboard = isAdmin ? location.pathname === '/admin/dashboard' : isMonitor ? location.pathname === '/monitor/reservations' : location.pathname === '/stagiaire/home'
  const isGroupSchedule = isAdmin ? location.pathname.startsWith('/admin/terrains') : isMonitor ? location.pathname === '/monitor/reservations' : location.pathname === '/stagiaire/my-reservations'
  const isSupport = !isAdmin && !isMonitor && location.pathname === '/stagiaire/contact-support'
  const profilePath = isAdmin ? '/admin/profile' : isMonitor ? '/monitor/profile' : '/stagiaire/profile'
  const displayName = user?.name ?? (isAdmin ? 'Admin' : isMonitor ? 'Monitor' : 'User')
  const studentIdLabel = user?.student_id || (user?.id ? `STG${String(user.id).padStart(6, '0')}` : 'STG------')

  return (
    <div className={isAdmin ? `admin-shell ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}` : 'admin-shell stagiaire-shell'}>
      {isAdmin ? <button type="button" className="admin-mobile-overlay" aria-label={t('close')} onClick={() => setMobileSidebarOpen(false)} /> : null}
      {isAdmin ? (
        <aside className="admin-sidebar">
        <div className="admin-brand">
          <div>
            <h2>DIA-EMPLOIS</h2>
            <p>{isAdmin ? t('administration') : t('traineePortal')}</p>
          </div>
        </div>

        <nav className="admin-nav">
          {primaryLinks.map((link) => (
            <Link key={link.label} to={link.to} className={location.pathname === link.to ? 'active admin-nav-item' : 'admin-nav-item'}>
              <span className="admin-nav-icon" aria-hidden>
                <NavIcon type={link.icon} />
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {resourcesLinks.length > 0 ? <p className="admin-settings-title">{t('resources')}</p> : null}

        <nav className="admin-nav settings-nav">
          {resourcesLinks.map((link) => (
            <Link key={link.label} to={link.to} className={location.pathname === link.to ? 'active admin-nav-item' : 'admin-nav-item'}>
              <span className="admin-nav-icon" aria-hidden>
                <NavIcon type={link.icon} />
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-bottom-tools">
          <div className="admin-user-box">
            <div className="admin-user-avatar">👨🏻‍💼</div>
            <div>
              <strong>{displayName}</strong>
              <span>{isAdmin ? t('adminRole') : t('stagiaireRole')}</span>
            </div>
          </div>
        </div>
        </aside>
      ) : null}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-brand">
            {isAdmin ? (
              <button
                type="button"
                className="admin-sidebar-toggle"
                aria-label={mobileSidebarOpen ? t('close') : t('menu')}
                aria-expanded={mobileSidebarOpen}
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
              >
                {mobileSidebarOpen ? '✕' : '☰'}
              </button>
            ) : null}
            <img
              src="/image.png"
              alt="OFPPT"
              className="ofppt-logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="ofppt-divider" aria-hidden />
          </div>

          <div className="admin-top-navs">
            <Link to={isAdmin ? '/admin/dashboard' : isMonitor ? '/monitor/reservations' : '/stagiaire/home'} className={isDashboard ? 'admin-top-link active' : 'admin-top-link'}>
              {isAdmin ? t('dashboard') : isMonitor ? t('manageReservations') : t('home')}
            </Link>
            <Link to={isAdmin ? '/admin/terrains' : isMonitor ? '/monitor/profile' : '/stagiaire/my-reservations'} className={isGroupSchedule ? 'admin-top-link active' : 'admin-top-link'}>
              {isAdmin ? t('manageTerrains') : isMonitor ? t('profile') : t('myReservations')}
            </Link>
            {!isAdmin && !isMonitor ? (
              <Link to="/stagiaire/contact-support" className={isSupport ? 'admin-top-link active' : 'admin-top-link'}>
                {t('contactSupport')}
              </Link>
            ) : null}
          </div>

          <div className="admin-top-actions">
            <div className="lang-menu-wrap" ref={langMenuRef}>
              <button type="button" className="icon-btn" onClick={() => setOpenLangMenu((prev) => !prev)} title={language.toUpperCase()}>
                🌐
              </button>

              {openLangMenu ? (
                <div className="lang-menu-list">
                  {[
                    { code: 'fr', label: 'Francais' },
                    { code: 'en', label: 'English' },
                    { code: 'ar', label: 'Arabic' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={language === lang.code ? 'lang-menu-item active' : 'lang-menu-item'}
                      onClick={() => {
                        onLanguageChange(lang.code)
                        setOpenLangMenu(false)
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="user-menu-wrap" ref={userMenuRef}>
              <div className="user-theme-switch" role="group" aria-label={t('darkMode')}>
                <button
                  type="button"
                  className="theme-choice-btn active"
                  title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                  aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
                  onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
                >
                  {theme === 'dark' ? '☀' : '🌙'}
                </button>
              </div>

              <button type="button" className="admin-user-chip" onClick={() => setOpenUserMenu((prev) => !prev)}>
                {displayName}
                <span aria-hidden>▾</span>
              </button>

              {openUserMenu ? (
                <div className="user-menu-list">
                  {!isAdmin && !isMonitor ? (
                    <div className="user-menu-meta">
                      <span>{t('studentId')}</span>
                      <strong>{studentIdLabel}</strong>
                    </div>
                  ) : null}
                  <div className="user-menu-lang">
                    <span>{t('language')}</span>
                    <div className="user-menu-lang-row">
                      {[
                        { code: 'fr', label: 'FR' },
                        { code: 'en', label: 'EN' },
                        { code: 'ar', label: 'AR' },
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          className={language === lang.code ? 'user-menu-lang-btn active' : 'user-menu-lang-btn'}
                          onClick={() => onLanguageChange(lang.code)}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      setOpenUserMenu(false)
                      navigate(profilePath)
                    }}
                  >
                    {t('profile')}
                  </button>
                  <button
                    type="button"
                    className="user-menu-item danger"
                    onClick={async () => {
                      setOpenUserMenu(false)
                      await onLogout()
                    }}
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <section className="admin-content">
        <Outlet />
        </section>
      </main>
    </div>
  )
}
