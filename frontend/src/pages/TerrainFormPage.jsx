import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { normalizeTerrainImageUrl } from '../api/imageUrls'
import { createTerrain, fetchTerrains, updateTerrain } from '../features/terrains/terrainsSlice'

const initialForm = {
  name: '',
  type: 'Football 11',
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
  const [existingImages, setExistingImages] = useState([])
  const [newImageFiles, setNewImageFiles] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])

  const normalizeTerrainType = (value) => {
    const normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'gazon') return 'Football 11'
    if (normalized === 'football 11') return 'Football 11'
    if (normalized === 'basket') return 'Basketball'
    if (normalized === 'basketball') return 'Basketball'
    if (normalized === 'volley') return 'Volley'
    if (normalized === 'futsal') return 'Futsal'
    return 'Football 11'
  }

  const currentTerrain = useMemo(
    () => terrains.find((terrain) => terrain.id === Number(terrainId)),
    [terrains, terrainId],
  )

  const currentTerrainImages = useMemo(() => {
    if (!currentTerrain) return []

    const gallery = Array.isArray(currentTerrain.image_urls) ? currentTerrain.image_urls : []
    const merged = [...gallery]

    if (currentTerrain.image_url) {
      merged.unshift(currentTerrain.image_url)
    }

    return Array.from(new Set(merged.filter(Boolean)))
  }, [currentTerrain])

  useEffect(() => {
    dispatch(fetchTerrains())
  }, [dispatch])

  useEffect(() => {
    if (!isEdit || !currentTerrain) return

    setForm({
      name: currentTerrain.name ?? '',
      type: normalizeTerrainType(currentTerrain.type),
      location: currentTerrain.location ?? 'CMC Campus',
      capacity: Number(currentTerrain.capacity ?? 10),
      status: currentTerrain.status === 'maintenance' ? 'inactive' : currentTerrain.status ?? 'active',
      online_booking: Boolean(currentTerrain.online_booking),
    })
    setExistingImages(currentTerrainImages)
    setNewImageFiles([])
  }, [currentTerrain, currentTerrainImages, isEdit])

  useEffect(() => {
    const previews = newImageFiles.map((file) => ({
      key: `${file.name}-${file.lastModified}-${file.size}`,
      url: URL.createObjectURL(file),
      file,
    }))

    setNewImagePreviews(previews)

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [newImageFiles])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onImageFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length === 0) return

    setNewImageFiles((prev) => [...prev, ...selectedFiles].slice(0, 10))
    event.target.value = ''
  }

  const removeExistingImage = (urlToRemove) => {
    setExistingImages((prev) => prev.filter((url) => url !== urlToRemove))
  }

  const removeNewImage = (indexToRemove) => {
    setNewImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
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
    payload.append('replace_images', '1')

    existingImages.forEach((url) => payload.append('image_urls[]', url))
    newImageFiles.forEach((file) => payload.append('images[]', file))

    try {
      const action = isEdit
        ? await dispatch(updateTerrain({ id: Number(terrainId), payload }))
        : await dispatch(createTerrain(payload))

      if (updateTerrain.fulfilled.match(action) || createTerrain.fulfilled.match(action)) {
        navigate('/admin/terrains')
      }
    } finally {
      setSaving(false)
    }
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
          <input type="file" accept="image/*" multiple onChange={onImageFilesChange} />
        </label>

        {isEdit && existingImages.length > 0 ? (
          <div className="terrain-form-gallery">
            <p className="terrain-form-gallery-title">{t('currentImage')}</p>
            <div className="terrain-form-gallery-grid">
              {existingImages.map((imageUrl) => (
                <div key={imageUrl} className="terrain-form-gallery-item">
                  <img src={normalizeTerrainImageUrl(imageUrl)} alt={currentTerrain?.name || 'Terrain'} className="terrain-form-preview" />
                  <button type="button" className="terrain-gallery-remove-btn" onClick={() => removeExistingImage(imageUrl)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {newImageFiles.length > 0 ? (
          <div className="terrain-form-gallery">
            <p className="terrain-form-gallery-title">New Images</p>
            <div className="terrain-form-gallery-grid">
              {newImagePreviews.map((preview, index) => (
                <div key={preview.key} className="terrain-form-gallery-item">
                  <img src={preview.url} alt={preview.file.name} className="terrain-form-preview" />
                  <button type="button" className="terrain-gallery-remove-btn" onClick={() => removeNewImage(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <label>
          {t('terrainType')}
          <select value={form.type} onChange={(e) => onChange('type', e.target.value)}>
            <option value="Football 11">Football 11</option>
            <option value="Volley">Volley</option>
            <option value="Futsal">Futsal</option>
            <option value="Basketball">Basketball</option>
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
