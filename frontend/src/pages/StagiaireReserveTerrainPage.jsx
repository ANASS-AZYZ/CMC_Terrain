import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchReservations } from '../features/reservations/reservationsSlice'
import { fetchTerrains } from '../features/terrains/terrainsSlice'

export default function StagiaireReserveTerrainPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const terrains = useAppSelector((state) => state.terrains.items)
  const loading = useAppSelector((state) => state.terrains.loading)
  const reservations = useAppSelector((state) => state.reservations.items)
  const locationLink = 'https://maps.app.goo.gl/dPyetBDqNWnQXYWT9'
  const mapEmbedSrc = 'https://www.google.com/maps?q=Cite+des+Metiers+et+des+Competences+de+Rabat-Sale-Kenitra&output=embed'

  useEffect(() => {
    dispatch(fetchTerrains())
    dispatch(fetchReservations())
  }, [dispatch])

  const reservableTerrains = useMemo(
    () => terrains.filter((terrain) => terrain.status === 'active' && Boolean(terrain.online_booking)),
    [terrains],
  )

  const capacityLabel = (capacity) => {
    const maxPlayers = Number(capacity) || 0
    const minPlayers = Math.max(2, maxPlayers - 10)
    return `${minPlayers}-${maxPlayers} ${t('players')}`
  }

  const upcomingReservations = useMemo(() => {
    const now = new Date()

    return reservations
      .filter((reservation) => new Date(reservation.starts_at) >= now)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
      .slice(0, 4)
      .map((reservation) => ({
        id: reservation.id,
        studentName: reservation.student_name || `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim(),
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

  return (
    <section className="stagiaire-home-page">
      <header className="stagiaire-home-head">
        <h1>{t('bookYourField')}</h1>
        <p>{t('bookYourFieldSubtitle')}</p>
      </header>

      {loading ? <p className="stagiaire-reserve-empty">{t('loadingTerrains')}</p> : null}

      {!loading && reservableTerrains.length === 0 ? (
        <p className="stagiaire-reserve-empty">{t('noOnlineTerrains')}</p>
      ) : null}

      <div className="stagiaire-home-grid">
        {reservableTerrains.map((terrain) => (
          <article key={terrain.id} className="stagiaire-home-card">
            {terrain.image_url ? <img src={terrain.image_url} alt={terrain.name} className="stagiaire-home-image" /> : null}

            <div className="stagiaire-home-card-top">
              <h3>{terrain.name}</h3>
              <span className="terrain-status-badge active">{String(terrain.type || 'OUTDOOR').toUpperCase()}</span>
            </div>

            <p className="stagiaire-home-meta">{terrain.location || 'CMC Campus'}</p>

            <div className="stagiaire-home-features">
              <span>{t('capacity')}: {capacityLabel(terrain.capacity)}</span>
              <span>{t('floodlightsAvailable')}</span>
            </div>

            <p className="stagiaire-home-description">
              {t('terrainCardDescription')}
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
                  <th>{t('studentName')}</th>
                  <th>{t('fieldTerrain')}</th>
                  <th>{t('date')}</th>
                  <th>{t('timeSlot')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.studentName || '-'}</td>
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
