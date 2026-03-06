import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createStagiaire, deleteStagiaire, fetchStagiaires, updateStagiaire } from '../features/stagiaires/stagiairesSlice'

const defaultForm = {
  first_name: '',
  last_name: '',
  cin: '',
  class_name: '',
  filiere: '',
  email: '',
  password: '',
}

export default function StagiairesPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const stagiaires = useAppSelector((state) => state.stagiaires.items)
  const loading = useAppSelector((state) => state.stagiaires.loading)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    dispatch(fetchStagiaires())
  }, [dispatch])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      cin: form.cin.trim(),
      class_name: form.class_name.trim(),
      filiere: form.filiere.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }

    if (editingId) {
      const updatePayload = { ...payload }
      if (!updatePayload.password.trim()) {
        delete updatePayload.password
      }

      await dispatch(updateStagiaire({ id: editingId, payload: updatePayload }))
    } else {
      await dispatch(createStagiaire(payload))
    }

    setSaving(false)
    setForm(defaultForm)
    setEditingId(null)
    setShowPassword(false)
    setShowForm(false)
  }

  const onEdit = (stagiaire) => {
    const [firstName = '', ...rest] = (stagiaire.name || '').split(' ')
    const lastNameFromName = rest.join(' ').trim()

    setEditingId(stagiaire.id)
    setForm({
      first_name: stagiaire.first_name || firstName,
      last_name: stagiaire.last_name || lastNameFromName,
      cin: stagiaire.cin || '',
      class_name: stagiaire.class_name || '',
      filiere: stagiaire.filiere || '',
      email: stagiaire.email || '',
      password: '',
    })
    setShowPassword(false)
    setShowForm(true)
  }

  const onDelete = async (stagiaire) => {
    if (!window.confirm(t('confirmDeleteStagiaire', { name: stagiaire.name }))) {
      return
    }

    await dispatch(deleteStagiaire(stagiaire.id))

    if (editingId === stagiaire.id) {
      setEditingId(null)
      setForm(defaultForm)
      setShowPassword(false)
      setShowForm(false)
    }
  }

  const filteredStagiaires = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return stagiaires

    return stagiaires.filter((stagiaire) => {
      const searchable = [
        stagiaire.name,
        stagiaire.cin,
        stagiaire.class_name,
        stagiaire.filiere,
        stagiaire.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(keyword)
    })
  }, [search, stagiaires])

  return (
    <section className="stagiaires-management">
      <div className="stagiaires-head">
        <h2>{t('manageStagiaires')}</h2>
        <div className="stagiaires-controls">
          <input
            type="search"
            placeholder={t('searchStagiairePlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="stagiaire-btn-add" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? t('closeForm') : t('addStagiaire')}
          </button>
        </div>
      </div>

      {showForm ? (
        <form className="stagiaire-form-card" onSubmit={onSubmit}>
          <label>
            {t('firstName')}
            <input value={form.first_name} onChange={(e) => onChange('first_name', e.target.value)} required />
          </label>

          <label>
            {t('lastName')}
            <input value={form.last_name} onChange={(e) => onChange('last_name', e.target.value)} required />
          </label>

          <label>
            CIN
            <input value={form.cin} onChange={(e) => onChange('cin', e.target.value)} required />
          </label>

          <label>
            {t('className')}
            <input value={form.class_name} onChange={(e) => onChange('class_name', e.target.value)} required />
          </label>

          <label>
            {t('filiere')}
            <input value={form.filiere} onChange={(e) => onChange('filiere', e.target.value)} required />
          </label>

          <label>
            {t('email')}
            <input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} required />
          </label>

          <label>
            {editingId ? t('passwordOptionalEdit') : t('password')}
            <div className="stagiaire-password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                minLength={8}
                required={!editingId}
                placeholder={editingId ? t('newPasswordIfNeeded') : ''}
              />
              <button type="button" className="stagiaire-password-toggle" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? t('hide') : t('show')}
              </button>
            </div>
            {editingId ? (
              <div className="stagiaire-current-password" aria-label="mot-de-passe-actuel">
                <span>{t('currentPassword')}:</span>
                <strong>********</strong>
              </div>
            ) : null}
          </label>

          <div className="stagiaire-form-actions">
            {editingId ? (
              <button
                type="button"
                className="reservation-btn-cancel"
                onClick={() => {
                  setEditingId(null)
                  setForm(defaultForm)
                  setShowPassword(false)
                  setShowForm(false)
                }}
              >
                {t('cancel')}
              </button>
            ) : null}
            <button type="submit" className="stagiaire-btn-save" disabled={saving}>
              {saving ? t('saving') : editingId ? t('saveChanges') : t('createStagiaireAccount')}
            </button>
          </div>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Stagiaire</th>
              <th>{t('studentId')}</th>
              <th>CIN</th>
              <th>{t('className')}</th>
              <th>{t('filiere')}</th>
              <th>{t('email')}</th>
              <th>{t('reservations')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>{t('loading')}</td>
              </tr>
            ) : filteredStagiaires.length === 0 ? (
              <tr>
                <td colSpan={8}>{search ? t('noResults') : t('noData')}</td>
              </tr>
            ) : (
              filteredStagiaires.map((stagiaire) => (
                <tr key={stagiaire.id ?? stagiaire.email}>
                  <td>{stagiaire.name}</td>
                  <td>{stagiaire.student_id || '-'}</td>
                  <td>{stagiaire.cin || '-'}</td>
                  <td>{stagiaire.class_name || '-'}</td>
                  <td>{stagiaire.filiere || '-'}</td>
                  <td>{stagiaire.email}</td>
                  <td>{stagiaire.reservations_count ?? 0}</td>
                  <td>
                    <div className="stagiaire-row-actions">
                      <button type="button" className="stagiaire-action edit" onClick={() => onEdit(stagiaire)}>
                        {t('edit')}
                      </button>
                      <button type="button" className="stagiaire-action delete" onClick={() => onDelete(stagiaire)}>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
