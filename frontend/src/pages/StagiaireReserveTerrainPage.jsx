import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { normalizeTerrainImageUrl } from '../api/imageUrls'
import { fetchReservations } from '../features/reservations/reservationsSlice'
import { fetchTerrains } from '../features/terrains/terrainsSlice'

export default function StagiaireReserveTerrainPage() {
  const SWIPE_MIN_DISTANCE = 40
  const SLIDE_ANIMATION_DURATION_MS = 220
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const terrains = useAppSelector((state) => state.terrains.items)
  const loading = useAppSelector((state) => state.terrains.loading)
  const reservations = useAppSelector((state) => state.reservations.items)
  const [imageIndexByTerrain, setImageIndexByTerrain] = useState({})
  const [slideDirectionByTerrain, setSlideDirectionByTerrain] = useState({})
  const [selectedTerrainType, setSelectedTerrainType] = useState('all')
  const touchStartByTerrainRef = useRef({})
  const slideTimeoutByTerrainRef = useRef({})
  const locationLink = 'https://maps.app.goo.gl/dPyetBDqNWnQXYWT9'
  const mapEmbedSrc = 'https://www.google.com/maps?q=Cite+des+Metiers+et+des+Competences+de+Rabat-Sale-Kenitra&output=embed'

  useEffect(() => {
    dispatch(fetchTerrains())
    dispatch(fetchReservations())
  }, [dispatch])

  useEffect(() => {
    const timeouts = slideTimeoutByTerrainRef.current
    return () => {
      Object.values(timeouts).forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  const reservableTerrains = useMemo(
    () => terrains.filter((terrain) => terrain.status === 'active' && Boolean(terrain.online_booking)),
    [terrains],
  )

  const normalizeTerrainType = (typeValue) => {
    const normalized = String(typeValue || '').trim().toLowerCase()
    if (normalized === 'basket') return 'basketball'
    if (normalized === 'gazon') return 'football 11'
    return normalized
  }

  const terrainTypeChoices = useMemo(() => {
    const uniqueTypes = Array.from(new Set(reservableTerrains.map((terrain) => normalizeTerrainType(terrain.type)).filter(Boolean)))
    return ['all', ...uniqueTypes]
  }, [reservableTerrains])

  const filteredTerrains = useMemo(() => {
    if (selectedTerrainType === 'all') {
      return reservableTerrains
    }

    return reservableTerrains.filter((terrain) => normalizeTerrainType(terrain.type) === selectedTerrainType)
  }, [reservableTerrains, selectedTerrainType])

  const upcomingReservations = useMemo(() => {
    const now = new Date()

    return reservations
      .filter((reservation) => new Date(reservation.starts_at) >= now)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
      .slice(0, 4)
      .map((reservation) => ({
        id: reservation.id,
        code: reservation.reservation_code || String(reservation.id).padStart(5, '0'),
        terrainName: reservation.terrain?.name || '-',
        dateLabel: new Date(reservation.starts_at).toLocaleDateString(),
        timeLabel: `${new Date(reservation.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(reservation.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: reservation.status || 'pending',
      }))
  }, [reservations])

  const getStatusBadgeClass = (status) => {
    if (status === 'confirmed') return 'status-badge confirmed'
    if (status === 'completed') return 'status-badge completed'
    if (status === 'cancelled') return 'status-badge cancelled'
    if (status === 'on_hold') return 'status-badge hold'
    return 'status-badge pending'
  }

  const getStatusLabel = (status) => {
    if (status === 'confirmed') return t('statusConfirmed')
    if (status === 'completed') return t('statusCompleted')
    if (status === 'cancelled') return t('statusCancelled')
    if (status === 'on_hold') return t('statusOnHold')
    if (status === 'rejected') return t('statusRejected')
    return t('statusPending')
  }

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
    <section className="stagiaire-home-page">
      <header className="stagiaire-home-head">
        <h1>{t('bookYourField')}</h1>
        <p>{t('bookYourFieldSubtitle')}</p>
      </header>

      <div className="stagiaire-type-filter-row">
        <label htmlFor="stagiaire-terrain-type-filter">{t('terrainType')}</label>
        <select
          id="stagiaire-terrain-type-filter"
          value={selectedTerrainType}
          onChange={(event) => setSelectedTerrainType(event.target.value)}
        >
          {terrainTypeChoices.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="stagiaire-reserve-empty">{t('loadingTerrains')}</p> : null}

      {!loading && filteredTerrains.length === 0 ? (
        <p className="stagiaire-reserve-empty">{t('noOnlineTerrains')}</p>
      ) : null}

      <div className="stagiaire-home-grid">
        {filteredTerrains.map((terrain) => (
          <article key={terrain.id} className="stagiaire-home-card">
            {(() => {
              const images = getTerrainImages(terrain)
              const currentIndex = images.length > 0 ? (imageIndexByTerrain[terrain.id] ?? 0) % images.length : 0

              return images.length > 0 ? (
                <div
                  className="stagiaire-home-image-wrap"
                  onTouchStart={(event) => onImageTouchStart(terrain.id, event)}
                  onTouchEnd={(event) => onImageTouchEnd(terrain.id, images.length, event)}
                >
                  <img
                    src={images[currentIndex]}
                    alt={terrain.name}
                    className={`stagiaire-home-image ${slideDirectionByTerrain[terrain.id] ? `is-sliding-${slideDirectionByTerrain[terrain.id]}` : ''}`}
                  />
                  {images.length > 1 ? (
                    <>
                      <span className="terrain-image-counter">{currentIndex + 1}/{images.length}</span>
                    </>
                  ) : null}
                </div>
              ) : null
            })()}

            <div className="stagiaire-home-card-top">
              <h3>{terrain.name}</h3>
            </div>

            <p className="stagiaire-home-meta">
              {t('playersCapacity')}: {Number(terrain.capacity) || '-'}
            </p>

            <button
              type="button"
              className="reserve-card-btn"
              onClick={() => navigate(`/stagiaire/terrains/${terrain.id}/availability`)}
            >
              {t('checkAvailability')}
            </button>
          </article>
        ))}
      </div>

      <section className="stagiaire-upcoming-panel">
        <div className="stagiaire-upcoming-head">
          <h2>{t('yourUpcomingReservations')}</h2>
          <button type="button" className="card-link-btn" onClick={() => navigate('/stagiaire/my-reservations')}>
            {t('viewHistory')}
          </button>
        </div>

        {upcomingReservations.length === 0 ? (
          <div className="upcoming-empty-state">
            <div className="upcoming-empty-icon">⌧</div>
            <h3>{t('noUpcomingBookings')}</h3>
            <p>{t('noUpcomingBookingsHint')}</p>
            <button
              type="button"
              className="upcoming-empty-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {t('exploreAllTerrains')}
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('reservationNumber')}</th>
                  <th>{t('fieldTerrain')}</th>
                  <th>{t('date')}</th>
                  <th>{t('timeSlot')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.map((item) => (
                  <tr key={item.id}>
                    <td>RES-{item.code}</td>
                    <td>{item.terrainName}</td>
                    <td>{item.dateLabel}</td>
                    <td>{item.timeLabel}</td>
                    <td>
                      <span className={getStatusBadgeClass(item.status)}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stagiaire-location-card">
        <div className="stagiaire-location-text">
          <span>{t('facilityInfo')}</span>
          <h3>{t('cantFindLocation')}</h3>
          <p>
            {t('facilityDescription')}
          </p>

          <div className="stagiaire-location-points">
            <p>
              <strong>{t('mainSportsComplex')}</strong>
              <small>Cite des Metiers et des Competences de Rabat-Sale-Kenitra</small>
            </p>
            <p>
              <strong>{t('operatingHours')}</strong>
              <small>Mon - Sat: 10:00 AM - 18:00 PM</small>
            </p>
          </div>
        </div>

        <div className="stagiaire-location-map">
          <iframe
            title="CMC Location Map"
            src={mapEmbedSrc}
            className="stagiaire-location-map-frame"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a className="stagiaire-location-map-link" href={locationLink} target="_blank" rel="noreferrer">
            {t('openGoogleMaps')}
          </a>
        </div>
      </section>
    </section>
  )
}
