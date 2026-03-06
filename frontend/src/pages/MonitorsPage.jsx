import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createMonitor, deleteMonitor, fetchMonitors, updateMonitor } from '../features/monitors/monitorsSlice'

const defaultForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
}

export default function MonitorsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const monitors = useAppSelector((state) => state.monitors.items)
  const loading = useAppSelector((state) => state.monitors.loading)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    dispatch(fetchMonitors())
  }, [dispatch])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSubmitError('')

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }

    let result

    if (editingId) {
      const updatePayload = { ...payload }
      if (!updatePayload.password.trim()) {
        delete updatePayload.password
      }

      result = await dispatch(updateMonitor({ id: editingId, payload: updatePayload }))
    } else {
      result = await dispatch(createMonitor(payload))
    }

    if (createMonitor.rejected.match(result) || updateMonitor.rejected.match(result)) {
      const message = result.payload?.message || result.error?.message || t('monitorSaveFailed')

      if (typeof message === 'string' && message.toLowerCase().includes('unauthorized')) {
        setSubmitError('')
        setSaving(false)
        setEditingId(null)
        setForm(defaultForm)
        setShowPassword(false)
        setShowForm(false)
        await dispatch(fetchMonitors())
        return
      }

      setSubmitError(message)
      setSaving(false)
      return
    }

    await dispatch(fetchMonitors())

    setSaving(false)
    setSubmitError('')
    setForm(defaultForm)
    setEditingId(null)
    setShowPassword(false)
    setShowForm(false)
  }

  const onEdit = (monitor) => {
    const [firstName = '', ...rest] = (monitor.name || '').split(' ')
    const lastNameFromName = rest.join(' ').trim()

    setEditingId(monitor.id)
    setForm({
      first_name: monitor.first_name || firstName,
      last_name: monitor.last_name || lastNameFromName,
      email: monitor.email || '',
      password: '',
    })
    setShowPassword(false)
    setShowForm(true)
  }

  const onDelete = async (monitor) => {
    if (!window.confirm(t('confirmDeleteMonitor', { name: monitor.name }))) {
      return
    }

    const result = await dispatch(deleteMonitor(monitor.id))

    if (deleteMonitor.rejected.match(result)) {
      return
    }

    await dispatch(fetchMonitors())

    if (editingId === monitor.id) {
      setEditingId(null)
      setForm(defaultForm)
      setShowPassword(false)
      setShowForm(false)
    }
  }

  const filteredMonitors = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return monitors

    return monitors.filter((monitor) => {
      const searchable = [monitor.name, monitor.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(keyword)
    })
  }, [search, monitors])

  return (
    <section className="stagiaires-management">
      <div className="stagiaires-head">
        <h2>{t('manageMonitors')}</h2>
        <div className="stagiaires-controls">
          <input
            type="search"
            placeholder={t('searchMonitorPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="stagiaire-btn-add" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? t('closeForm') : t('addMonitor')}
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
              {saving ? t('saving') : editingId ? t('saveChanges') : t('createMonitorAccount')}
            </button>
          </div>

          {submitError ? <p className="reservation-slot-hint">{submitError}</p> : null}
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('monitor')}</th>
              <th>{t('email')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>{t('loading')}</td>
              </tr>
            ) : filteredMonitors.length === 0 ? (
              <tr>
                <td colSpan={3}>{search ? t('noResults') : t('noData')}</td>
              </tr>
            ) : (
              filteredMonitors.map((monitor) => (
                <tr key={monitor.id ?? monitor.email}>
                  <td>{monitor.name}</td>
                  <td>{monitor.email}</td>
                  <td>
                    <div className="stagiaire-row-actions">
                      <button type="button" className="stagiaire-action edit" onClick={() => onEdit(monitor)}>
                        {t('edit')}
                      </button>
                      <button type="button" className="stagiaire-action delete" onClick={() => onDelete(monitor)}>
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
