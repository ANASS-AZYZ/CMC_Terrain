import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    cin: '',
    class_name: '',
    filiere: '',
    password: '',
    password_confirmation: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (form.password !== form.password_confirmation) {
      setLoading(false)
      setError('La confirmation du mot de passe est incorrecte.')
      return
    }

    try {
      await api.post('/register', {
        ...form,
        email: form.email.trim(),
      })

      setVerificationEmail(form.email.trim().toLowerCase())
      setSuccess('Compte cree. Un code de verification a ete envoye vers votre Gmail.')
      setStep(2)
    } catch (err) {
      const apiMessage = err?.response?.data?.message
      const validationErrors = err?.response?.data?.errors

      if (validationErrors?.email?.length) {
        setError(validationErrors.email[0])
      } else if (validationErrors?.cin?.length) {
        setError(validationErrors.cin[0])
      } else {
        setError(apiMessage || 'Creation du compte echouee. Verifiez vos informations.')
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/email/verify-code', {
        email: verificationEmail,
        code: verificationCode.trim(),
      })

      setSuccess('Email verifie avec succes. Redirection vers login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification echouee. Verifiez le code.')
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationCode = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/email/resend-verification', { email: verificationEmail })
      setSuccess('Nouveau code envoye vers votre Gmail.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de renvoyer le code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e9f4ff_0%,_#f6f8fb_45%,_#eef2f7_100%)] text-[#132738] grid place-items-center px-4 py-8">
      <div className="w-full max-w-[760px] rounded-[20px] border border-[#d8e4f1] bg-white/90 shadow-[0_24px_70px_rgba(15,39,65,0.12)] p-8 md:p-10 grid gap-5">
        <h1 className="m-0 text-center text-[34px] md:text-[42px] leading-[1.05] font-['Sora'] font-extrabold text-[#132738]">Creer Votre Compte</h1>
        <p className="m-0 text-center text-[16px] text-[#5b7590]">
          {step === 1
            ? 'Remplissez toutes vos informations pour creer votre compte stagiaire.'
            : `Saisissez le code envoye a ${verificationEmail} pour verifier votre Gmail.`}
        </p>

        {step === 1 ? (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="font-bold text-sm text-[#27384a]">
            Prenom
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
          </label>

          <label className="font-bold text-sm text-[#27384a]">
            Nom
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
          </label>

          <label className="font-bold text-sm text-[#27384a] md:col-span-2">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
            <p className="m-0 mt-1 text-[12px] font-semibold text-[#5b7590]">Format requis: example@gmail.com</p>
          </label>

          <label className="font-bold text-sm text-[#27384a]">
            CIN
            <input
              type="text"
              value={form.cin}
              onChange={(e) => updateField('cin', e.target.value)}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
          </label>

          <label className="font-bold text-sm text-[#27384a]">
            Classe
            <input
              type="text"
              value={form.class_name}
              onChange={(e) => updateField('class_name', e.target.value)}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
          </label>

          <label className="font-bold text-sm text-[#27384a]">
            Filiere
            <input
              type="text"
              value={form.filiere}
              onChange={(e) => updateField('filiere', e.target.value)}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
          </label>

          <label className="font-bold text-sm text-[#27384a]">
            Mot de passe
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                minLength={8}
                required
                className="w-full border border-[#c9d8e7] rounded-[12px] px-4 pr-11 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
              />
              {form.password ? (
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center justify-center p-0 bg-transparent text-[#22384d]"
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
          </label>

          <label className="font-bold text-sm text-[#27384a]">
            Confirmer mot de passe
            <div className="relative mt-2">
              <input
                type={showPasswordConfirmation ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={(e) => updateField('password_confirmation', e.target.value)}
                minLength={8}
                required
                className="w-full border border-[#c9d8e7] rounded-[12px] px-4 pr-11 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
              />
              {form.password_confirmation ? (
                <button
                  type="button"
                  aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center justify-center p-0 bg-transparent text-[#22384d]"
                >
                  {showPasswordConfirmation ? (
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

          <div className="md:col-span-2 grid gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#5aa5d7] hover:bg-[#4d99cc] transition-colors text-white rounded-[12px] py-[12px] font-['Sora'] font-bold shadow-[0_10px_24px_rgba(59,140,197,0.28)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creation...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="bg-transparent border border-[#c9d8e7] rounded-[12px] py-[11px] font-semibold text-[#4c6e8c]"
            >
              Retour au login
            </button>
          </div>
        </form>
        ) : (
        <form className="grid gap-4" onSubmit={verifyEmail}>
          <label className="font-bold text-sm text-[#27384a]">
            Code de verification
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              minLength={6}
              maxLength={6}
              required
              className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] tracking-[0.2em] text-center text-[20px] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#5aa5d7] hover:bg-[#4d99cc] transition-colors text-white rounded-[12px] py-[12px] font-['Sora'] font-bold shadow-[0_10px_24px_rgba(59,140,197,0.28)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Verification...' : 'Verifier Mon Gmail'}
          </button>

          <button
            type="button"
            onClick={resendVerificationCode}
            disabled={loading}
            className="bg-transparent border border-[#c9d8e7] rounded-[12px] py-[11px] font-semibold text-[#4c6e8c] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Renvoyer le code
          </button>
        </form>
        )}

        {error ? <p className="m-0 rounded-[10px] border border-[#f1c1cc] bg-[#fff4f7] px-3 py-2 text-[#b72a4e] font-semibold text-sm">{error}</p> : null}
        {success ? <p className="m-0 rounded-[10px] border border-[#bee8cf] bg-[#f1fff6] px-3 py-2 text-[#1f8f58] font-semibold text-sm">{success}</p> : null}
      </div>
    </div>
  )
}
