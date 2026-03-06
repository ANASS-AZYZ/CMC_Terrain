import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createTerrain, fetchTerrains, updateTerrain } from '../features/terrains/terrainsSlice'

const initialForm = {
  name: '',
  image_url: '',
  type: 'Gazon',
  location: 'CMC Campus',
  capacity: 10,
  status: 'active',
  online_booking: true,
}

export default function TerrainFormPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { terrainId } = useParams()
  const terrains = useAppSelector((state) => state.terrains.items)
  const isEdit = Boolean(terrainId)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)

  const currentTerrain = useMemo(
    () => terrains.find((terrain) => terrain.id === Number(terrainId)),
    [terrains, terrainId],
  )

  useEffect(() => {
    dispatch(fetchTerrains())
  }, [dispatch])

  useEffect(() => {
    if (!isEdit || !currentTerrain) return

    setForm({
      name: currentTerrain.name ?? '',
      image_url: currentTerrain.image_url ?? '',
      type: currentTerrain.type ?? 'Gazon',
      location: currentTerrain.location ?? 'CMC Campus',
      capacity: Number(currentTerrain.capacity ?? 10),
      status: currentTerrain.status === 'maintenance' ? 'inactive' : currentTerrain.status ?? 'active',
      online_booking: Boolean(currentTerrain.online_booking),
    })
  }, [currentTerrain, isEdit])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = new FormData()
    payload.append('name', form.name.trim())
    payload.append('type', form.type)
    payload.append('location', form.location.trim())
    payload.append('capacity', String(Number(form.capacity)))
    payload.append('status', form.status)
    payload.append('online_booking', form.online_booking ? '1' : '0')

    if (imageFile) {
      payload.append('image', imageFile)
    }

    if (isEdit) {
      await dispatch(updateTerrain({ id: Number(terrainId), payload }))
    } else {
      await dispatch(createTerrain(payload))
    }

    setSaving(false)
    navigate('/admin/terrains')
  }

  return (
    <section className="terrain-form-page">
      <div className="terrain-form-header">
        <h2>{isEdit ? t('editTerrain') : t('addNewTerrain')}</h2>
        <p>{t('terrainFormSubtitle')}</p>
      </div>

      <form className="terrain-form-card" onSubmit={onSubmit}>
        <label>
          {t('terrainName')}
          <input value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder={t('terrainNamePlaceholder')} required />
        </label>

        <label>
          {t('terrainImageFromPc')}
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </label>

        {currentTerrain?.image_url ? (
          <label>
            {t('currentImage')}
            <img src={currentTerrain.image_url} alt={currentTerrain.name} className="terrain-form-preview" />
          </label>
        ) : null}

        <label>
          {t('terrainType')}
          <select value={form.type} onChange={(e) => onChange('type', e.target.value)}>
            <option value="Gazon">Gazon</option>
            <option value="Futsal">Futsal</option>
            <option value="Volley">Volley</option>
            <option value="Basket">Basket</option>
          </select>
        </label>

        <label>
          {t('location')}
          <input value={form.location} onChange={(e) => onChange('location', e.target.value)} placeholder={t('locationPlaceholder')} required />
        </label>

        <label>
          {t('playersCapacity')}
          <input
            type="number"
            min={2}
            value={form.capacity}
            onChange={(e) => onChange('capacity', e.target.value)}
            required
          />
        </label>

        <label>
          {t('status')}
          <select value={form.status} onChange={(e) => onChange('status', e.target.value)}>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </label>

        <label className="terrain-form-checkbox">
          <input
            type="checkbox"
            checked={Boolean(form.online_booking)}
            onChange={(e) => onChange('online_booking', e.target.checked)}
          />
          <span>{t('onlineBookingEnabled')}</span>
        </label>

        <div className="terrain-form-actions">
          <button type="button" className="terrain-btn-cancel" onClick={() => navigate('/admin/terrains')}>
            {t('cancel')}
          </button>
          <button type="submit" className="terrain-btn-save" disabled={saving}>
            {saving ? t('saving') : isEdit ? t('updateTerrain') : t('createTerrain')}
          </button>
        </div>
      </form>
    </section>
  )
}
