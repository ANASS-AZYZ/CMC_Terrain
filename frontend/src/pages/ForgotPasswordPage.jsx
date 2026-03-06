import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const portal = searchParams.get('portal') === 'admin' ? 'admin' : 'stagiaire'
  const backLoginPath = portal === 'admin' ? '/login_admin' : '/login_stagiare'

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getFriendlyError = (err, fallback) => {
    const raw = err?.response?.data?.message
    if (!raw) return fallback

    if (
      raw.includes('Gmail authentication failed') ||
      raw.includes('BadCredentials') ||
      raw.includes('535-5.7.8')
    ) {
      return 'Service email indisponible pour le moment. Veuillez reessayer plus tard.'
    }

    return raw
  }

  const title = useMemo(() => {
    if (step === 1) return 'Reinitialiser Mot De Passe'
    if (step === 2) return 'Verification Du Code'
    return 'Nouveau Mot De Passe'
  }, [step])

  const sendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/password/forgot', { email: email.trim() })
      setSuccess('Code envoye a votre email. Verifiez votre boite de reception.')

      setStep(2)
    } catch (err) {
      const message = getFriendlyError(err, 'Impossible d\'envoyer le code. Verifiez votre email.')
      setError(message)

      if (message.includes('Aucun compte trouve')) {
        setTimeout(() => navigate('/login'), 1200)
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.post('/password/verify-code', {
        email: email.trim(),
        code: code.trim(),
      })
      setResetToken(data.reset_token)
      setSuccess('Code correct. Vous pouvez maintenant definir un nouveau mot de passe.')
      setStep(3)
    } catch (err) {
      setError(getFriendlyError(err, 'Code incorrect ou expire.'))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setLoading(false)
      setError('La confirmation du mot de passe est incorrecte.')
      return
    }

    try {
      await api.post('/password/reset', {
        email: email.trim(),
        reset_token: resetToken,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
      setSuccess('Mot de passe modifie avec succes. Redirection vers login...')
      setTimeout(() => navigate(backLoginPath), 1200)
    } catch (err) {
      setError(getFriendlyError(err, 'Echec de reinitialisation. Recommencez le processus.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e9f4ff_0%,_#f6f8fb_45%,_#eef2f7_100%)] text-[#132738] grid place-items-center px-4 py-8">
      <div className="w-full max-w-[620px] rounded-[20px] border border-[#d8e4f1] bg-white/85 backdrop-blur-[2px] shadow-[0_24px_70px_rgba(15,39,65,0.12)] p-8 md:p-10 grid gap-5">
        <div className="inline-flex justify-self-center items-center gap-3 rounded-full border border-[#d5e4f2] bg-[#f4f9ff] px-4 py-1.5 text-xs font-semibold text-[#2b5072] tracking-[0.08em] uppercase">
          <span className="h-2 w-2 rounded-full bg-[#2a90d8]" />
          CMC Account Recovery
        </div>

        <h1 className="m-0 text-center text-[34px] md:text-[42px] leading-[1.05] font-['Sora'] font-extrabold text-[#132738]">{title}</h1>
        <p className="m-0 text-center text-[16px] text-[#5b7590]">
          {step === 1 ? 'Entrez votre email academique pour recevoir un code de verification.' : null}
          {step === 2 ? 'Entrez le code recu par email pour continuer.' : null}
          {step === 3 ? 'Definissez un nouveau mot de passe securise.' : null}
        </p>

        {step === 1 ? (
          <form className="grid gap-4" onSubmit={sendCode}>
            <label className="font-bold text-sm text-[#27384a]">
              Academic Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
              />
            </label>
            <button type="submit" disabled={loading} className="bg-[#5aa5d7] hover:bg-[#4d99cc] transition-colors text-white rounded-[12px] py-[12px] font-['Sora'] font-bold shadow-[0_10px_24px_rgba(59,140,197,0.28)] disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Envoi...' : 'Envoyer Le Code'}
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="grid gap-4" onSubmit={verifyCode}>
            <label className="font-bold text-sm text-[#27384a]">
              Code Recu Par Email
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                minLength={6}
                maxLength={6}
                required
                className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] tracking-[0.22em] text-center text-[20px] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
              />
            </label>
            <button type="submit" disabled={loading} className="bg-[#5aa5d7] hover:bg-[#4d99cc] transition-colors text-white rounded-[12px] py-[12px] font-['Sora'] font-bold shadow-[0_10px_24px_rgba(59,140,197,0.28)] disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Verification...' : 'Verifier Le Code'}
            </button>
          </form>
        ) : null}

        {step === 3 ? (
          <form className="grid gap-4" onSubmit={resetPassword}>
            <label className="font-bold text-sm text-[#27384a]">
              Nouveau Mot De Passe
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
              />
            </label>

            <label className="font-bold text-sm text-[#27384a]">
              Confirmer Mot De Passe
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="mt-2 w-full border border-[#c9d8e7] rounded-[12px] px-4 py-3 bg-[#f9fcff] text-[#22384d] outline-none focus:border-[#5aa5d7] focus:ring-2 focus:ring-[#5aa5d733]"
              />
            </label>

            <button type="submit" disabled={loading} className="bg-[#5aa5d7] hover:bg-[#4d99cc] transition-colors text-white rounded-[12px] py-[12px] font-['Sora'] font-bold shadow-[0_10px_24px_rgba(59,140,197,0.28)] disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Enregistrement...' : 'Modifier Mot De Passe'}
            </button>
          </form>
        ) : null}

        {error ? <p className="m-0 rounded-[10px] border border-[#f1c1cc] bg-[#fff4f7] px-3 py-2 text-[#b72a4e] font-semibold text-sm">{error}</p> : null}
        {success ? <p className="m-0 rounded-[10px] border border-[#bee8cf] bg-[#f1fff6] px-3 py-2 text-[#1f8f58] font-semibold text-sm">{success}</p> : null}

        <button
          type="button"
          onClick={() => navigate(backLoginPath)}
          className="justify-self-start bg-transparent border-0 p-0 text-[#5aa5d7] font-semibold hover:text-[#3f8ec2] transition-colors"
        >
          Retour au login
        </button>
      </div>
    </div>
  )
}
