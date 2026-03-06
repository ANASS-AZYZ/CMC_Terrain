import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useAppSelector } from '../app/hooks'

export default function StagiaireContactSupportPage() {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/support-messages', {
        first_name: user?.first_name || user?.name?.split(' ')[0] || '',
        last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '-',
        email: user?.email || '',
        subject: subject.trim(),
        message: message.trim(),
      })

      setSubject('')
      setMessage('')
      setSuccess(t('supportSent'))
    } catch {
      setError(t('supportSendFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="stagiaire-support-page">
      <form className="stagiaire-support-card support-message-form" onSubmit={onSubmit}>
        <h2>{t('contactSupport')}</h2>
        <p>{t('supportMessageHint')}</p>

        <label>
          {t('firstName')}
          <input value={user?.first_name || user?.name?.split(' ')[0] || ''} readOnly />
        </label>

        <label>
          {t('lastName')}
          <input value={user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '-'} readOnly />
        </label>

        <label>
          {t('email')}
          <input value={user?.email || ''} readOnly />
        </label>

        <label>
          {t('subject')}
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('supportSubjectPlaceholder')} required />
        </label>

        <label>
          {t('message')}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('supportMessagePlaceholder')}
            minLength={10}
            rows={8}
            required
          />
        </label>

        {error ? <p className="profile-msg error">{error}</p> : null}
        {success ? <p className="profile-msg success">{success}</p> : null}

        <div className="stagiaire-support-actions">
          <button type="submit" className="reserve-card-btn" disabled={sending}>
            {sending ? t('sending') : t('sendToAdmin')}
          </button>
        </div>
      </form>
    </section>
  )
}
