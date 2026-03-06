import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addReservationPlayer, deleteReservation, fetchReservations, updateReservationStatus } from '../features/reservations/reservationsSlice'

export default function ReservationsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const reservations = useAppSelector((state) => state.reservations.items)
  const user = useAppSelector((state) => state.auth.user)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [addPlayerReservation, setAddPlayerReservation] = useState(null)
  const [playersSourceReservation, setPlayersSourceReservation] = useState(null)
  const [studentIdToAdd, setStudentIdToAdd] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [addPlayerError, setAddPlayerError] = useState('')
  const [playersList, setPlayersList] = useState([])
  const [playersLoading, setPlayersLoading] = useState(false)
  const [playersError, setPlayersError] = useState('')
  const [reservationLookupId, setReservationLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [statusReservationId, setStatusReservationId] = useState('')
  const [statusSelection, setStatusSelection] = useState('completed')
  const [statusFormError, setStatusFormError] = useState('')
  const [statusFormLoading, setStatusFormLoading] = useState(false)
  const [editingStatusId, setEditingStatusId] = useState(null)
  const [editingStatusValue, setEditingStatusValue] = useState('completed')
  const [rowStatusLoadingId, setRowStatusLoadingId] = useState(null)

  const addPath = user?.role === 'stagiaire' ? '/stagiaire/home' : '/admin/reservations/new'
  const isMonitor = user?.role === 'monitor'

  useEffect(() => {
    dispatch(fetchReservations())
  }, [dispatch])

  const rows = useMemo(
    () =>
      reservations.map((reservation) => {
        const nom = reservation.first_name || reservation.student_name?.split(' ')[0] || '-'
        const prenom = reservation.last_name || reservation.student_name?.split(' ').slice(1).join(' ') || '-'
        return {
          ...reservation,
          nom,
          prenom,
          code: reservation.reservation_code ?? '-------',
          ownerName: reservation.creator?.name ?? '-',
          terrainLabel: reservation.terrain?.name ?? reservation.terrain_id,
          dateLabel: new Date(reservation.starts_at).toLocaleDateString(),
          timeLabel: `${new Date(reservation.starts_at).toLocaleTimeString()} - ${new Date(reservation.ends_at).toLocaleTimeString()}`,
        }
      }),
    [reservations],
  )

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

  const completedReservations = useMemo(
    () => rows.filter((reservation) => reservation.status === 'completed'),
    [rows],
  )

  const cancelledReservations = useMemo(
    () => rows.filter((reservation) => reservation.status === 'cancelled'),
    [rows],
  )

  const runReservationLookup = () => {
    const rawValue = reservationLookupId.trim()

    if (!rawValue) {
      setLookupResult(null)
      return
    }

    const foundReservation = rows.find((reservation) => String(reservation.code) === rawValue || String(reservation.id) === rawValue)
    setLookupResult({ found: Boolean(foundReservation), reservation: foundReservation || null })
  }

  const statusManagedRows = useMemo(
    () => rows.filter((reservation) => reservation.status === 'completed' || reservation.status === 'cancelled'),
    [rows],
  )

  const submitStatusFromForm = async () => {
    const rawValue = statusReservationId.trim()

    setStatusFormError('')

    if (!rawValue) {
      setStatusFormError(t('reservationIdInvalid'))
      return
    }

    const found = rows.find((reservation) => String(reservation.code) === rawValue || String(reservation.id) === rawValue)
    if (!found) {
      setStatusFormError(t('reservationNotFoundById'))
      return
    }

    setStatusFormLoading(true)
    const result = await dispatch(updateReservationStatus({ id: found.id, status: statusSelection }))
    setStatusFormLoading(false)

    if (updateReservationStatus.rejected.match(result)) {
      setStatusFormError(result.error?.message || t('statusChangeFailed'))
      return
    }

    setStatusFormError('')
    setStatusReservationId('')
    await dispatch(fetchReservations())
  }

  const submitStatusFromRow = async (reservationId) => {
    setRowStatusLoadingId(reservationId)
    const result = await dispatch(updateReservationStatus({ id: reservationId, status: editingStatusValue }))
    setRowStatusLoadingId(null)

    if (updateReservationStatus.rejected.match(result)) {
      return
    }

    setEditingStatusId(null)
    await dispatch(fetchReservations())
  }

  if (isMonitor) {
    return (
      <section className="reservations-management">
        <div className="reservation-head">
          <h2>{t('manageReservations')}</h2>
        </div>

        <article className="reservation-audit-card">
          <div className="reservation-panel-head">
            <h3>{t('reservationStatusFormTitle')}</h3>
          </div>

          <div className="reservation-checker-row">
            <input
              type="text"
              value={statusReservationId}
              onChange={(e) => setStatusReservationId(e.target.value)}
              placeholder={t('reservationIdPlaceholder')}
              className="reservation-checker-input"
            />

            <select
              value={statusSelection}
              onChange={(e) => setStatusSelection(e.target.value)}
              className="reservation-checker-input"
            >
              <option value="completed">{t('statusCompleted')}</option>
              <option value="cancelled">{t('statusCancelled')}</option>
            </select>

            <button
              type="button"
              className="reservation-add-btn"
              onClick={submitStatusFromForm}
              disabled={statusFormLoading}
            >
              {statusFormLoading ? t('saving') : t('confirmStatusChange')}
            </button>
          </div>

          {statusFormError ? <p className="reservation-slot-hint">{statusFormError}</p> : null}
        </article>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('reservationNumber')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {statusManagedRows.length === 0 ? (
                <tr>
                  <td colSpan={3}>{t('noData')}</td>
                </tr>
              ) : (
                statusManagedRows.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.code || reservation.id}</td>
                    <td>
                      <span className={getStatusBadgeClass(reservation.status)}>{getStatusLabel(reservation.status)}</span>
                    </td>
                    <td>
                      {editingStatusId === reservation.id ? (
                        <div className="reservation-actions-cell">
                          <select
                            value={editingStatusValue}
                            onChange={(e) => setEditingStatusValue(e.target.value)}
                            className="reservation-action-btn"
                          >
                            <option value="completed">{t('statusCompleted')}</option>
                            <option value="cancelled">{t('statusCancelled')}</option>
                          </select>
                          <button
                            type="button"
                            className="reservation-action-btn"
                            disabled={rowStatusLoadingId === reservation.id}
                            onClick={() => submitStatusFromRow(reservation.id)}
                          >
                            {rowStatusLoadingId === reservation.id ? t('saving') : t('validateStatusChange')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="reservation-action-btn"
                          onClick={() => {
                            setEditingStatusId(reservation.id)
                            setEditingStatusValue(reservation.status === 'cancelled' ? 'cancelled' : 'completed')
                          }}
                        >
                          {t('modifyStatus')}
                        </button>
                      )}
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

  const loadPlayersByCode = async (reservation) => {
    if (!reservation?.code || reservation.code === '-------') {
      setPlayersList([])
      setPlayersError('Code reservation invalide.')
      return
    }

    setPlayersLoading(true)
    setPlayersError('')

    try {
      const { data } = await api.get(`/reservations/code/${reservation.code}`)
      setPlayersList(Array.isArray(data?.players) ? data.players : [])
    } catch {
      setPlayersList([])
      setPlayersError('Impossible de charger la liste des joueurs.')
    } finally {
      setPlayersLoading(false)
    }
  }

  return (
    <section className="reservations-management">
      <div className="reservation-head">
        <h2>{user?.role === 'stagiaire' ? t('myReservations') : t('manageReservations')}</h2>
        <button type="button" className="reservation-add-btn" onClick={() => navigate(addPath)}>
          {t('addReservation')}
        </button>
      </div>

      {user?.role === 'admin' ? (
        <article className="reservation-audit-card">
          <div className="reservation-panel-head">
            <h3>{t('reservationCheckerTitle')}</h3>
          </div>

          <p className="reservation-checker-hint">{t('reservationCheckerHint')}</p>

          <div className="reservation-checker-row">
            <input
              type="text"
              value={reservationLookupId}
              onChange={(e) => setReservationLookupId(e.target.value)}
              placeholder={t('reservationIdPlaceholder')}
              className="reservation-checker-input"
            />
            <button type="button" className="reservation-add-btn" onClick={runReservationLookup}>
              {t('checkReservation')}
            </button>
          </div>

          {lookupResult ? (
            <div className={`reservation-check-result ${lookupResult.found ? 'found' : 'missing'}`}>
              {lookupResult.found ? t('reservationFound') : t('reservationNotFound')}
              {lookupResult.found && lookupResult.reservation ? (
                <span>
                  {` ID #${lookupResult.reservation.id} - ${lookupResult.reservation.terrainLabel} - ${getStatusLabel(lookupResult.reservation.status)}`}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="reservation-status-lists">
            <div className="reservation-status-list-card">
              <h4>{t('completedReservationsList')}</h4>
              <ul>
                {completedReservations.length === 0 ? <li>{t('noCompletedReservations')}</li> : null}
                {completedReservations.map((reservation) => (
                  <li key={`completed-${reservation.id}`}>
                    {`ID #${reservation.id} - ${reservation.dateLabel}`}
                  </li>
                ))}
              </ul>
            </div>

            <div className="reservation-status-list-card">
              <h4>{t('cancelledReservationsList')}</h4>
              <ul>
                {cancelledReservations.length === 0 ? <li>{t('noCancelledReservations')}</li> : null}
                {cancelledReservations.map((reservation) => (
                  <li key={`cancelled-${reservation.id}`}>
                    {`ID #${reservation.id} - ${reservation.dateLabel}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('firstName')}</th>
              <th>{t('lastName')}</th>
              <th>{t('terrain')}</th>
              <th>{t('date')}</th>
              <th>{t('time')}</th>
              <th>{t('status')}</th>
              <th>{t('code')}</th>
              <th>{t('reservedBy')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.nom}</td>
                <td>{reservation.prenom}</td>
                <td>{reservation.terrainLabel}</td>
                <td>{reservation.dateLabel}</td>
                <td>{reservation.timeLabel}</td>
                <td>
                  <span className={getStatusBadgeClass(reservation.status)}>{getStatusLabel(reservation.status)}</span>
                </td>
                <td>{reservation.code}</td>
                <td>{reservation.ownerName}</td>
                <td className="reservation-actions-cell">
                  <button
                    type="button"
                    className="reservation-action-btn"
                    onClick={() => {
                      const isOpen = selectedReservation?.id === reservation.id

                      if (isOpen) {
                        setSelectedReservation(null)
                        return
                      }

                      setAddPlayerReservation(null)
                      setPlayersSourceReservation(null)
                      setSelectedReservation(reservation)
                      setStudentIdToAdd('')
                      setAddPlayerError('')
                    }}
                  >
                    {selectedReservation?.id === reservation.id ? t('closeDetails') : t('details')}
                  </button>
                  <button
                    type="button"
                    className="reservation-action-btn"
                    onClick={() => {
                      const isOpen = playersSourceReservation?.id === reservation.id

                      if (isOpen) {
                        setPlayersSourceReservation(null)
                        setPlayersList([])
                        setPlayersError('')
                        return
                      }

                      setSelectedReservation(null)
                      setAddPlayerReservation(null)
                      setPlayersSourceReservation(reservation)
                      setPlayersList([])
                      loadPlayersByCode(reservation)
                    }}
                  >
                    {playersSourceReservation?.id === reservation.id ? t('closePlayers') : t('seePlayers')}
                  </button>
                  <button
                    type="button"
                    className="reservation-action-btn"
                    onClick={() => {
                      const isOpen = addPlayerReservation?.id === reservation.id

                      if (isOpen) {
                        setAddPlayerReservation(null)
                        return
                      }

                      setPlayersSourceReservation(null)
                      setSelectedReservation(null)
                      setAddPlayerReservation(reservation)
                      setStudentIdToAdd('')
                      setAddPlayerError('')
                    }}
                  >
                    {addPlayerReservation?.id === reservation.id ? t('close') : t('addPlayer')}
                  </button>
                  {user?.role === 'admin' ? (
                    <button
                      type="button"
                      className="reservation-icon-btn"
                      onClick={() => navigate(`/admin/reservations/${reservation.id}/edit`)}
                      title={t('edit')}
                    >
                      ✎
                    </button>
                  ) : null}
                  {user?.role === 'admin' ? (
                    <button
                      type="button"
                      className="reservation-icon-btn danger"
                      onClick={() => dispatch(deleteReservation(reservation.id))}
                      title={t('delete')}
                    >
                      🗑
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReservation ? (
        <article className="reservation-details-card">
          <div className="reservation-panel-head">
            <h3>Details Reservation</h3>
            <button type="button" className="reservation-close-btn" onClick={() => setSelectedReservation(null)}>
              {t('close')}
            </button>
          </div>
          <div className="reservation-pass-card">
            <div className="reservation-pass-top">
              <div>
                <span className="reservation-pass-label">{t('officialPass')}</span>
                <h4>{selectedReservation.terrainLabel}</h4>
                <p className="reservation-pass-sub">{t('cmcSportsComplex')}</p>
              </div>
              <div className="reservation-pass-id-wrap">
                <span className="reservation-pass-label">{t('referenceCode')}</span>
                <strong>{selectedReservation.code}</strong>
                <small>ID #{selectedReservation.id}</small>
              </div>
            </div>

            <div className="reservation-pass-body">
              <div className="reservation-pass-data">
                <p>
                  <span>{t('studentName')}</span>
                  <strong>{`${selectedReservation.nom} ${selectedReservation.prenom}`.trim()}</strong>
                </p>
                <p>
                  <span>CIN</span>
                  <strong>{selectedReservation.cin || '-'}</strong>
                </p>
                <p>
                  <span>{t('className')}</span>
                  <strong>{selectedReservation.class_name || '-'}</strong>
                </p>
                <p>
                  <span>{t('dateAndTime')}</span>
                  <strong>{selectedReservation.dateLabel}</strong>
                  <em>{selectedReservation.timeLabel}</em>
                </p>
                <p>
                  <span>{t('status')}</span>
                  <strong className="reservation-pass-status">{getStatusLabel(selectedReservation.status)}</strong>
                </p>
              </div>

              <div className="reservation-pass-media">
                {selectedReservation.terrain?.image_url ? (
                  <img
                    src={selectedReservation.terrain.image_url}
                    alt={selectedReservation.terrainLabel}
                    className="reservation-pass-terrain-img"
                  />
                ) : (
                  <div className="reservation-pass-media-fallback">{t('noTerrainPhoto')}</div>
                )}
              </div>
            </div>

            <div className="reservation-pass-footer">
              <p>
                <strong>{t('filiere')}:</strong> {selectedReservation.filiere || '-'}
              </p>
              <p>
                <strong>{t('email')}:</strong> {selectedReservation.student_email}
              </p>
              <p>
                <strong>{t('reservedBy')}:</strong> {selectedReservation.ownerName}
              </p>
            </div>
          </div>

        </article>
      ) : null}

      {addPlayerReservation ? (
        <article className="reservation-details-card">
          <div className="reservation-panel-head">
            <h3>Ajouter Joueur</h3>
            <button type="button" className="reservation-close-btn" onClick={() => setAddPlayerReservation(null)}>
              {t('close')}
            </button>
          </div>

          <div className="reservation-add-player-form">
            <input
              value={studentIdToAdd}
              onChange={(e) => setStudentIdToAdd(e.target.value)}
              placeholder={t('studentIdPlaceholder')}
            />
            <button
              type="button"
              className="reservation-btn-save"
              disabled={addingPlayer || !studentIdToAdd.trim()}
              onClick={async () => {
                setAddingPlayer(true)
                setAddPlayerError('')

                const result = await dispatch(
                  addReservationPlayer({
                    reservationId: addPlayerReservation.id,
                    studentId: studentIdToAdd.trim(),
                  }),
                )

                setAddingPlayer(false)

                if (addReservationPlayer.rejected.match(result)) {
                  setAddPlayerError(result.error?.message || t('addPlayerError'))
                  return
                }

                setStudentIdToAdd('')
                setAddPlayerReservation(null)
                setPlayersSourceReservation(addPlayerReservation)
                await loadPlayersByCode(addPlayerReservation)
                dispatch(fetchReservations())
              }}
            >
              {addingPlayer ? t('adding') : t('add')}
            </button>
          </div>

          {addPlayerError ? <p className="reservation-slot-hint">{addPlayerError}</p> : null}
        </article>
      ) : null}

      {playersSourceReservation ? (
        <article className="reservation-players-card">
          <div className="reservation-panel-head">
            <h3>Joueurs Du Match</h3>
            <button type="button" className="reservation-close-btn" onClick={() => setPlayersSourceReservation(null)}>
              {t('close')}
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('studentName')}</th>
                  <th>{t('className')}</th>
                  <th>CIN</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {playersLoading ? (
                  <tr>
                    <td colSpan={4}>{t('loadingPlayers')}</td>
                  </tr>
                ) : null}

                {!playersLoading && playersError ? (
                  <tr>
                    <td colSpan={4}>{playersError}</td>
                  </tr>
                ) : null}

                {!playersLoading && !playersError && playersList.length === 0 ? (
                  <tr>
                    <td colSpan={4}>{t('noPlayersInReservation')}</td>
                  </tr>
                ) : null}

                {!playersLoading && !playersError && playersList.map((player, index) => (
                  <tr key={player.id}>
                    <td>{`${player.first_name || player.student_name?.split(' ')[0] || ''} ${player.last_name || player.student_name?.split(' ').slice(1).join(' ') || ''}`.trim()}</td>
                    <td>{player.class_name || '-'}</td>
                    <td>{player.cin || '-'}</td>
                    <td>{index === 0 ? t('mainReservationOwner') : t('associatedPlayer')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  )
}
