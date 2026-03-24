import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { normalizeTerrainImageUrl } from '../api/imageUrls'
import { deleteTerrain, fetchTerrains, updateTerrain } from '../features/terrains/terrainsSlice'

export default function TerrainsPage() {
  const SWIPE_MIN_DISTANCE = 40
  const SLIDE_ANIMATION_DURATION_MS = 220
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const terrains = useAppSelector((state) => state.terrains.items)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [imageIndexByTerrain, setImageIndexByTerrain] = useState({})
  const [slideDirectionByTerrain, setSlideDirectionByTerrain] = useState({})
  const touchStartByTerrainRef = useRef({})
  const slideTimeoutByTerrainRef = useRef({})

  useEffect(() => {
    dispatch(fetchTerrains())
  }, [dispatch])

  useEffect(() => {
    const timeouts = slideTimeoutByTerrainRef.current
    return () => {
      Object.values(timeouts).forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  const onEdit = (terrain) => {
    navigate(`/admin/terrains/${terrain.id}/edit`)
  }

  const onDelete = async (terrainId) => {
    await dispatch(deleteTerrain(terrainId))
  }

  const onToggleOnlineBooking = async (terrain) => {
    const nextOnlineBooking = !terrain.online_booking

    await dispatch(
      updateTerrain({
        id: terrain.id,
        payload: {
          online_booking: nextOnlineBooking,
          status: nextOnlineBooking ? 'active' : 'inactive',
        },
      }),
    )
  }

  const normalizedTerrains = terrains.map((terrain) => ({
    ...terrain,
    terrainType:
      String(terrain.type || '').toLowerCase() === 'basket'
        ? 'basketball'
        : String(terrain.type || '').toLowerCase() === 'gazon'
          ? 'football 11'
          : String(terrain.type || '').toLowerCase(),
    terrainName: String(terrain.name || '').toLowerCase(),
    statusNormalized: terrain.status === 'maintenance' ? 'inactive' : terrain.status,
  }))

  const filteredTerrains = normalizedTerrains.filter((terrain) => {
    const matchesSearch = terrain.terrainName.includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' ? true : terrain.terrainType === typeFilter
    return matchesSearch && matchesType
  })

  const activeCount = terrains.filter((terrain) => terrain.status === 'active').length
  const inactiveCount = terrains.filter((terrain) => terrain.status === 'inactive' || terrain.status === 'maintenance').length

  const cardStatusClass = (status) => {
    if (status === 'active') return 'terrain-status-badge active'
    return 'terrain-status-badge inactive'
  }

  const capacityLabel = (capacity) => {
    const maxPlayers = Number(capacity) || 0
    const minPlayers = Math.max(2, maxPlayers - 10)
    return `${minPlayers}-${maxPlayers} Players`
  }

  const typeChoices = ['all', 'football 11', 'volley', 'futsal', 'basketball']

  const getTerrainImages = (terrain) => {
    const gallery = Array.isArray(terrain.image_urls) ? terrain.image_urls : []
    const merged = [...gallery]

    if (terrain.image_url) {
      merged.unshift(terrain.image_url)
    }

    return Array.from(new Set(merged.map(normalizeTerrainImageUrl).filter(Boolean)))
  }

  const goToPrevImage = (terrainId, imagesLength) => {
    setImageIndexByTerrain((prev) => {
      const current = prev[terrainId] ?? 0
      const next = (current - 1 + imagesLength) % imagesLength
      return { ...prev, [terrainId]: next }
    })
  }

  const goToNextImage = (terrainId, imagesLength) => {
    setImageIndexByTerrain((prev) => {
      const current = prev[terrainId] ?? 0
      const next = (current + 1) % imagesLength
      return { ...prev, [terrainId]: next }
    })
  }

  const setSlideDirection = (terrainId, direction) => {
    setSlideDirectionByTerrain((prev) => ({ ...prev, [terrainId]: direction }))

    const currentTimeout = slideTimeoutByTerrainRef.current[terrainId]
    if (currentTimeout) {
      window.clearTimeout(currentTimeout)
    }

    slideTimeoutByTerrainRef.current[terrainId] = window.setTimeout(() => {
      setSlideDirectionByTerrain((prev) => {
        const next = { ...prev }
        delete next[terrainId]
        return next
      })
      delete slideTimeoutByTerrainRef.current[terrainId]
    }, SLIDE_ANIMATION_DURATION_MS)
  }

  const goToPrevImageWithAnimation = (terrainId, imagesLength) => {
    setSlideDirection(terrainId, 'prev')
    goToPrevImage(terrainId, imagesLength)
  }

  const goToNextImageWithAnimation = (terrainId, imagesLength) => {
    setSlideDirection(terrainId, 'next')
    goToNextImage(terrainId, imagesLength)
  }

  const onImageTouchStart = (terrainId, event) => {
    const touch = event.changedTouches?.[0]
    if (!touch) return

    touchStartByTerrainRef.current[terrainId] = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const onImageTouchEnd = (terrainId, imagesLength, event) => {
    if (imagesLength < 2) return

    const touchStart = touchStartByTerrainRef.current[terrainId]
    delete touchStartByTerrainRef.current[terrainId]

    const touchEnd = event.changedTouches?.[0]
    if (!touchStart || !touchEnd) return

    const deltaX = touchEnd.clientX - touchStart.x
    const deltaY = touchEnd.clientY - touchStart.y

    if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return
    }

    if (deltaX < 0) {
      goToNextImageWithAnimation(terrainId, imagesLength)
      return
    }

    goToPrevImageWithAnimation(terrainId, imagesLength)
  }

  return (
    <section className="terrain-management">
      <div className="terrain-page-head">
        <div>
          <h2>Manage Terrains</h2>
        </div>

        <button type="button" className="terrain-add-btn" onClick={() => navigate('/admin/terrains/new')}>
          Add New Terrain
        </button>
      </div>

      <div className="terrain-filters">
        <label className="terrain-search-wrap">
          <span className="terrain-search-icon">⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search terrain name..." />
        </label>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {typeChoices.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type === 'basketball' ? 'Basketball' : type === 'football 11' ? 'Football 11' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="terrain-stats-row">
        <span className="terrain-dot active" /> {activeCount} Active
        <span className="terrain-dot inactive" /> {inactiveCount} Inactive
      </div>

      <div className="terrain-cards-grid">
        {filteredTerrains.map((terrain) => (
          <article key={terrain.id} className="terrain-card">
            {(() => {
              const images = getTerrainImages(terrain)
              const currentIndex = images.length > 0 ? (imageIndexByTerrain[terrain.id] ?? 0) % images.length : 0

              return images.length > 0 ? (
                <div
                  className="terrain-card-image-wrap"
                  onTouchStart={(event) => onImageTouchStart(terrain.id, event)}
                  onTouchEnd={(event) => onImageTouchEnd(terrain.id, images.length, event)}
                >
                  <img
                    src={images[currentIndex]}
                    alt={terrain.name}
                    className={`terrain-card-image ${slideDirectionByTerrain[terrain.id] ? `is-sliding-${slideDirectionByTerrain[terrain.id]}` : ''}`}
                  />
                  {images.length > 1 ? (
                    <>
                      <span className="terrain-image-counter">{currentIndex + 1}/{images.length}</span>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="terrain-card-image terrain-card-image-empty">No image</div>
              )
            })()}

            <div className="terrain-card-top">
              <h3>{terrain.name}</h3>
              <span className={cardStatusClass(terrain.statusNormalized)}>{terrain.statusNormalized || 'inactive'}</span>
            </div>

            <p className="terrain-card-meta">{terrain.type}</p>
            <p className="terrain-card-meta">{terrain.location || 'Campus Zone'}</p>

            <div className="terrain-capacity-row">
              <span>Capacity</span>
              <strong>{capacityLabel(terrain.capacity)}</strong>
            </div>

            <div className="terrain-booking-row">
              <span>Online Booking</span>
              <button
                type="button"
                className={terrain.online_booking ? 'booking-switch on' : 'booking-switch off'}
                onClick={() => onToggleOnlineBooking(terrain)}
                title="Toggle online booking"
              >
                <span className="booking-knob">{terrain.online_booking ? '✓' : ''}</span>
              </button>
            </div>

            <div className="terrain-card-actions">
              <button type="button" className="card-link-btn">
                View Schedule
              </button>
              <button type="button" className="icon-action-btn" onClick={() => onEdit(terrain)} title="Modifier">
                ✎
              </button>
              <button type="button" className="icon-action-btn delete" onClick={() => onDelete(terrain.id)} title="Supprimer">
                🗑
              </button>
            </div>
          </article>
        ))}

        {filteredTerrains.length === 0 ? (
          <div className="terrain-empty">
            {t('noData')}
          </div>
        ) : null}
      </div>
    </section>
  )
}
