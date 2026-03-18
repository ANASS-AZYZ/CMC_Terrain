import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { updatePasswordThunk, updateProfileThunk } from '../features/auth/authSlice'

const defaultForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
}

export default function AdminProfilePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [profileSaving, setProfileSaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  })
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    cin: '',
    class_name: '',
    filiere: '',
  })

  useEffect(() => {
    setProfileForm({
      first_name: user?.first_name || user?.name?.split(' ')[0] || '',
      last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      cin: user?.cin || '',
      class_name: user?.class_name || '',
      filiere: user?.filiere || '',
    })
  }, [user])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onProfileChange = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }))
  }

  const onProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileSaving(true)

    const result = await dispatch(
      updateProfileThunk({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
        cin: profileForm.cin.trim(),
        class_name: profileForm.class_name.trim(),
        filiere: profileForm.filiere.trim(),
      }),
    )

    setProfileSaving(false)

    if (updateProfileThunk.fulfilled.match(result)) {
      setProfileSuccess(t('profileUpdated'))
      return
    }

    setProfileError(result.payload || t('profileUpdateFailed'))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.new_password !== form.new_password_confirmation) {
      setError(t('passwordConfirmationIncorrect'))
      return
    }

    setSaving(true)
    const result = await dispatch(updatePasswordThunk(form))
    setSaving(false)

    if (updatePasswordThunk.fulfilled.match(result)) {
      setSuccess(result.payload || t('passwordUpdated'))
      setForm(defaultForm)
      return
    }

    setError(result.payload || t('passwordUpdateFailed'))
  }

  const roleLabel = user?.role === 'admin' ? t('adminRole') : t('stagiaireRole')
  const studentIdValue = user?.student_id || (user?.id ? `STG${String(user.id).padStart(6, '0')}` : 'STG------')

  return (
    <section className="admin-profile-page">
      <div className="admin-profile-head">
        <h2>{t('myProfile')}</h2>
        <p>{t('accountSecurityInfo')}</p>
      </div>

      <div className="admin-profile-grid">
        <form className="admin-profile-card admin-password-form" onSubmit={onProfileSubmit}>
          <h3>{t('personalInformation')}</h3>

          <label>
            {t('firstName')}
            <input
              type="text"
              value={profileForm.first_name}
              onChange={(e) => onProfileChange('first_name', e.target.value)}
              maxLength={80}
              required
            />
          </label>

          <label>
            {t('lastName')}
            <input
              type="text"
              value={profileForm.last_name}
              onChange={(e) => onProfileChange('last_name', e.target.value)}
              maxLength={80}
              required
            />
          </label>

          <label>
            {t('email')}
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => onProfileChange('email', e.target.value)}
              maxLength={120}
              required
            />
          </label>

          <label>
            CIN
            <input
              type="text"
              value={profileForm.cin}
              onChange={(e) => onProfileChange('cin', e.target.value)}
              maxLength={40}
            />
          </label>

          <label>
            {t('studentIdReadonly')}
            <input type="text" value={studentIdValue} readOnly />
          </label>

          {user?.role !== 'admin' ? (
            <>
              <label>
                {t('className')}
                <input
                  type="text"
                  value={profileForm.class_name}
                  onChange={(e) => onProfileChange('class_name', e.target.value)}
                  maxLength={120}
                />
              </label>

              <label>
                {t('filiere')}
                <input
                  type="text"
                  value={profileForm.filiere}
                  onChange={(e) => onProfileChange('filiere', e.target.value)}
                  maxLength={120}
                />
              </label>
            </>
          ) : null}

          <div className="admin-profile-info-list">
            <div>
              <span>Role</span>
              <strong>{roleLabel}</strong>
            </div>
          </div>

          {profileError ? <p className="profile-msg error">{profileError}</p> : null}
          {profileSuccess ? <p className="profile-msg success">{profileSuccess}</p> : null}

          <div className="admin-profile-actions">
            <button type="submit" className="stagiaire-btn-save" disabled={profileSaving}>
              {profileSaving ? t('saving') : t('saveInformation')}
            </button>
          </div>
        </form>

        <form className="admin-profile-card admin-password-form" onSubmit={onSubmit}>
          <h3>{t('changePassword')}</h3>

          <label>
            {t('currentPassword')}
            <div className="profile-password-input-wrap">
              <input
                type={passwordVisibility.current ? 'text' : 'password'}
                value={form.current_password}
                onChange={(e) => onChange('current_password', e.target.value)}
                minLength={6}
                required
              />
              {form.current_password ? (
                <button
                  type="button"
                  className="profile-password-toggle"
                  aria-label={passwordVisibility.current ? 'Hide password' : 'Show password'}
                  onClick={() => setPasswordVisibility((prev) => ({ ...prev, current: !prev.current }))}
                >
                  {passwordVisibility.current ? (
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
          </label>

          <label>
            {t('newPassword')}
            <div className="profile-password-input-wrap">
              <input
                type={passwordVisibility.next ? 'text' : 'password'}
                value={form.new_password}
                onChange={(e) => onChange('new_password', e.target.value)}
                minLength={8}
                required
              />
              {form.new_password ? (
                <button
                  type="button"
                  className="profile-password-toggle"
                  aria-label={passwordVisibility.next ? 'Hide password' : 'Show password'}
                  onClick={() => setPasswordVisibility((prev) => ({ ...prev, next: !prev.next }))}
                >
                  {passwordVisibility.next ? (
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
          </label>

          <label>
            {t('confirmPassword')}
            <div className="profile-password-input-wrap">
              <input
                type={passwordVisibility.confirm ? 'text' : 'password'}
                value={form.new_password_confirmation}
                onChange={(e) => onChange('new_password_confirmation', e.target.value)}
                minLength={8}
                required
              />
              {form.new_password_confirmation ? (
                <button
                  type="button"
                  className="profile-password-toggle"
                  aria-label={passwordVisibility.confirm ? 'Hide password' : 'Show password'}
                  onClick={() => setPasswordVisibility((prev) => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {passwordVisibility.confirm ? (
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
          </label>

          {error ? <p className="profile-msg error">{error}</p> : null}
          {success ? <p className="profile-msg success">{success}</p> : null}

          <div className="admin-profile-actions">
            <button type="submit" className="stagiaire-btn-save" disabled={saving}>
              {saving ? t('saving') : t('changePassword')}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
