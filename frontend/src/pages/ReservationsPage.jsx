import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import jsQR from 'jsqr'
import api from '../api/client'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addReservationPlayer, cancelOwnReservation, deleteReservation, fetchReservations, removeReservationPlayer, updateReservationStatus } from '../features/reservations/reservationsSlice'

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
  const [removingPlayerId, setRemovingPlayerId] = useState(null)
  const [reservationLookupId, setReservationLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [statusReservationId, setStatusReservationId] = useState('')
  const [statusSelection, setStatusSelection] = useState('completed')
  const [statusFormError, setStatusFormError] = useState('')
  const [statusFormLoading, setStatusFormLoading] = useState(false)
  const [cancelingReservation, setCancelingReservation] = useState(false)
  const [editingStatusId, setEditingStatusId] = useState(null)
  const [editingStatusValue, setEditingStatusValue] = useState('completed')
  const [rowStatusLoadingId, setRowStatusLoadingId] = useState(null)
  const [qrScanPayload, setQrScanPayload] = useState('')
  const [qrScanLoading, setQrScanLoading] = useState(false)
  const [qrScanError, setQrScanError] = useState('')
  const [qrScanSuccess, setQrScanSuccess] = useState('')
  const [qrPreviewLoading, setQrPreviewLoading] = useState(false)
  const [qrPreviewReservation, setQrPreviewReservation] = useState(null)
  const [qrPreviewError, setQrPreviewError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const [scannerReady, setScannerReady] = useState(false)
  const scannerVideoRef = useRef(null)
  const scannerStreamRef = useRef(null)
  const scannerFrameRef = useRef(null)
  const scannerDetectorRef = useRef(null)
  const scannerCanvasRef = useRef(null)

  const addPath = user?.role === 'stagiaire' ? '/stagiaire/home' : '/admin/reservations/new'
  const isMonitor = user?.role === 'monitor'

  useEffect(() => {
    dispatch(fetchReservations())
  }, [dispatch])

  const rows = useMemo(
    () => {
      const now = new Date()
      const scopedReservations = user?.role === 'stagiaire'
        ? reservations.filter((reservation) => new Date(reservation.ends_at) > now)
        : reservations

      return scopedReservations.map((reservation) => {
        const startsAt = new Date(reservation.starts_at)
        const endsAt = new Date(reservation.ends_at)

        const formatTime = (dateValue) => dateValue.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })

        const nom = reservation.first_name || reservation.student_name?.split(' ')[0] || '-'
        const prenom = reservation.last_name || reservation.student_name?.split(' ').slice(1).join(' ') || '-'
        return {
          ...reservation,
          nom,
          prenom,
          code: reservation.reservation_code ?? '-------',
          ownerName: reservation.creator?.name ?? '-',
          terrainLabel: reservation.terrain?.name ?? reservation.terrain_id,
          dateLabel: startsAt.toLocaleDateString(),
          timeLabel: `${formatTime(startsAt)} - ${formatTime(endsAt)}`,
        }
      })
    },
    [reservations, user?.role],
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

  const visibleRows = useMemo(() => {
    if (user?.role === 'stagiaire') {
      const now = new Date()
      return rows.filter((reservation) => {
        const isExpired = new Date(reservation.ends_at) <= now
        const isHiddenStatus = reservation.status === 'cancelled' || reservation.status === 'completed'
        return !isExpired && !isHiddenStatus
      })
    }

    return rows
  }, [rows, user?.role])

  const canCancelSelectedReservation = useMemo(() => {
    if (!selectedReservation) {
      return false
    }

    const isExpired = new Date(selectedReservation.ends_at) <= new Date()
    const isBlockedStatus = ['completed', 'cancelled', 'rejected'].includes(String(selectedReservation.status || ''))

    return !isExpired && !isBlockedStatus
  }, [selectedReservation])

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

  const loadReservationFromQrPayload = async (rawPayload) => {
    const payload = String(rawPayload || '').trim()
    setQrScanError('')
    setQrScanSuccess('')

    if (!payload) {
      setQrScanError(t('reservationIdInvalid'))
      return
    }

    setQrPreviewReservation(null)
    setQrPreviewError('')
    setQrPreviewLoading(true)

    const extractedCode = (() => {
      const normalized = payload.toUpperCase().trim()
      const prefixedMatch = normalized.match(/\bRES[-_ ]?(\d{5})\b/)

      if (prefixedMatch?.[1]) {
        return prefixedMatch[1]
      }

      const plainMatch = normalized.match(/\b(\d{5})\b/)
      return plainMatch?.[1] || null
    })()

    if (!extractedCode) {
      setQrPreviewLoading(false)
      setQrPreviewError(t('reservationIdInvalid'))
      return
    }

    try {
      const { data } = await api.get(`/reservations/code/${extractedCode}`)
      const reservation = data?.reservation

      if (!reservation) {
        setQrPreviewError(t('reservationNotFound'))
        return
      }

      const startsAt = reservation?.starts_at ? new Date(reservation.starts_at) : null
      const endsAt = reservation?.ends_at ? new Date(reservation.ends_at) : null
      const ownerName = reservation?.creator?.name || reservation?.student_name || '-'

      setQrPreviewReservation({
        id: reservation.id,
        code: reservation.reservation_code || extractedCode,
        ownerName,
        terrainLabel: reservation?.terrain?.name || reservation?.terrain_id || '-',
        dateLabel: startsAt ? startsAt.toLocaleDateString() : '-',
        timeLabel: startsAt && endsAt
          ? `${startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : '-',
        status: reservation.status || 'pending',
      })
    } catch (error) {
      const validationError = error?.response?.data?.errors
      const firstValidation = validationError ? Object.values(validationError)[0]?.[0] : null
      setQrPreviewError(firstValidation || error?.response?.data?.message || t('reservationNotFound'))
    } finally {
      setQrPreviewLoading(false)
    }
  }

  const submitQrScanConfirmation = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    await loadReservationFromQrPayload(qrScanPayload)
  }

  const completeReservationFromQrPayload = useCallback(async (rawPayload) => {
    const payload = String(rawPayload || '').trim()
    setQrScanError('')
    setQrScanSuccess('')

    if (!payload) {
      setQrScanError(t('reservationIdInvalid'))
      return
    }

    const extractedCode = (() => {
      const normalized = payload.toUpperCase().trim()
      const prefixedMatch = normalized.match(/\bRES[-_ ]?(\d{5})\b/)

      if (prefixedMatch?.[1]) {
        return prefixedMatch[1]
      }

      const plainMatch = normalized.match(/\b(\d{5})\b/)
      return plainMatch?.[1] || null
    })()

    if (!extractedCode) {
      setQrScanError(t('reservationIdInvalid'))
      return
    }

    setQrScanLoading(true)

    try {
      const { data } = await api.get(`/reservations/code/${extractedCode}`)
      const reservation = data?.reservation

      if (!reservation?.id) {
        setQrScanError(t('reservationNotFound'))
        return
      }

      await dispatch(updateReservationStatus({ id: reservation.id, status: 'completed' })).unwrap()
      setQrScanSuccess(t('qrCompleteSuccess', { code: extractedCode }))
      await dispatch(fetchReservations())
    } catch (error) {
      const validationError = error?.response?.data?.errors
      const firstValidation = validationError ? Object.values(validationError)[0]?.[0] : null
      setQrScanError(firstValidation || error?.response?.data?.message || t('qrCompleteFailed'))
    } finally {
      setQrScanLoading(false)
    }
  }, [dispatch, t])

  const confirmPreviewReservation = async () => {
    if (!qrPreviewReservation?.code) {
      setQrScanError(t('reservationIdInvalid'))
      return
    }

    setQrScanError('')
    setQrScanSuccess('')
    setQrScanLoading(true)

    try {
      const { data } = await api.post('/reservations/confirm-by-qr', {
        reservation_code: qrPreviewReservation.code,
      })

      setQrScanSuccess(t('qrCompleteSuccess', { code: data?.reservation_code || qrPreviewReservation.code }))
      setQrPreviewReservation((prev) => (prev ? { ...prev, status: data?.status || 'completed' } : prev))
      await dispatch(fetchReservations())
    } catch (error) {
      const validationError = error?.response?.data?.errors
      const firstValidation = validationError ? Object.values(validationError)[0]?.[0] : null
      setQrScanError(firstValidation || error?.response?.data?.message || t('qrCompleteFailed'))
    } finally {
      setQrScanLoading(false)
    }
  }

  const stopScanner = useCallback(() => {
    if (scannerFrameRef.current) {
      cancelAnimationFrame(scannerFrameRef.current)
      scannerFrameRef.current = null
    }

    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop())
      scannerStreamRef.current = null
    }

    scannerDetectorRef.current = null
    setScannerReady(false)
  }, [])

  const handleScannerDetected = useCallback((rawValue) => {
    const payload = String(rawValue || '').trim()

    if (!payload) {
      return
    }

    setQrScanPayload(payload)
    setScannerOpen(false)
    stopScanner()

    completeReservationFromQrPayload(payload)
  }, [completeReservationFromQrPayload, stopScanner])

  const startScanner = useCallback(async () => {
    setScannerError('')

    if (!window.isSecureContext) {
      setScannerError(t('scannerSecureContextRequired'))
      return
    }

    if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
      setScannerError(t('scannerNotSupported'))
      return
    }

    if ('BarcodeDetector' in window) {
      try {
        scannerDetectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      } catch {
        scannerDetectorRef.current = null
      }
    } else {
      scannerDetectorRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      })

      scannerStreamRef.current = stream

      if (!scannerVideoRef.current) {
        setScannerError(t('scannerStartFailed'))
        return
      }

      scannerVideoRef.current.srcObject = stream
      await scannerVideoRef.current.play()
      setScannerReady(true)

      const scanFrame = async () => {
        if (!scannerOpen || !scannerVideoRef.current || !scannerDetectorRef.current) {
          if (!scannerOpen || !scannerVideoRef.current) {
            return
          }
        }

        try {
          if (scannerDetectorRef.current) {
            const detections = await scannerDetectorRef.current.detect(scannerVideoRef.current)

            if (detections.length > 0 && detections[0]?.rawValue) {
              handleScannerDetected(detections[0].rawValue)
              return
            }
          } else {
            const video = scannerVideoRef.current
            const width = video.videoWidth
            const height = video.videoHeight

            if (width > 0 && height > 0) {
              if (!scannerCanvasRef.current) {
                scannerCanvasRef.current = document.createElement('canvas')
              }

              const canvas = scannerCanvasRef.current
              canvas.width = width
              canvas.height = height
              const context = canvas.getContext('2d', { willReadFrequently: true })

              if (context) {
                context.drawImage(video, 0, 0, width, height)
                const imageData = context.getImageData(0, 0, width, height)
                const decoded = jsQR(imageData.data, width, height)

                if (decoded?.data) {
                  handleScannerDetected(decoded.data)
                  return
                }
              }
            }
          }
        } catch {
          setScannerError(t('scannerReadFailed'))
        }

        scannerFrameRef.current = window.requestAnimationFrame(scanFrame)
      }

      scannerFrameRef.current = window.requestAnimationFrame(scanFrame)
    } catch {
      stopScanner()
      setScannerError(t('scannerPermissionDenied'))
    }
  }, [handleScannerDetected, scannerOpen, stopScanner, t])

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner()
      return
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [scannerOpen, startScanner, stopScanner])

  if (isMonitor) {
    return (
      <section className="reservations-management">
        <div className="reservation-head">
          <h2>{t('manageReservations')}</h2>
        </div>

        <article className="reservation-audit-card">
          <div className="reservation-panel-head">
            <h3>{t('qrScanTitle')}</h3>
            <button
              type="button"
              className="reservation-qr-scan-trigger"
              onClick={() => {
                setScannerError('')
                setScannerOpen(true)
              }}
              title={t('openScanner')}
              aria-label={t('openScanner')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                <rect x="7" y="10" width="10" height="4" rx="1" />
              </svg>
            </button>
          </div>

          <p className="reservation-checker-hint">{t('qrScanHint')}</p>

          {qrScanLoading ? <p className="reservation-checker-hint">{t('saving')}</p> : null}

          {qrScanError ? <p className="reservation-slot-hint">{qrScanError}</p> : null}
          {qrScanSuccess ? <p className="reservation-checker-hint">{qrScanSuccess}</p> : null}
        </article>

        {scannerOpen ? (
          <div className="reservation-scanner-backdrop" role="dialog" aria-modal="true" aria-label={t('qrScanTitle')}>
            <article className="reservation-scanner-modal">
              <div className="reservation-panel-head">
                <h3>{t('qrScanTitle')}</h3>
                <button
                  type="button"
                  className="reservation-close-btn"
                  onClick={() => setScannerOpen(false)}
                >
                  {t('close')}
                </button>
              </div>

              <p className="reservation-checker-hint">{t('scannerHint')}</p>

              <div className="reservation-scanner-video-wrap">
                <video ref={scannerVideoRef} className="reservation-scanner-video" autoPlay playsInline muted />
                <div className="reservation-scanner-target" aria-hidden />
              </div>

              {!scannerReady && !scannerError ? <p className="reservation-checker-hint">{t('scannerStarting')}</p> : null}
              {scannerError ? <p className="reservation-slot-hint">{scannerError}</p> : null}
            </article>
          </div>
        ) : null}

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
              <th>{t('reservationNumber')}</th>
              <th className="hide-on-mobile">{t('terrain')}</th>
              <th className="hide-on-mobile">{t('time')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((reservation) => (
              <tr key={reservation.id}>
                <td className="reservation-code-cell">
                  <strong>RES-{reservation.code}</strong>
                </td>
                <td className="hide-on-mobile">{reservation.terrainLabel}</td>
                <td className="hide-on-mobile">{reservation.timeLabel}</td>
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
                    title={t('details')}
                  >
                    {t('details')}
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
                    title={t('seePlayers')}
                  >
                    {t('seePlayers')}
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
                    title={t('addPlayer')}
                  >
                    {t('addPlayer')}
                  </button>
                  {user?.role === 'admin' ? (
                    <button
                      type="button"
                      className="reservation-action-btn"
                      onClick={() => navigate(`/admin/reservations/${reservation.id}/edit`)}
                      title={t('edit')}
                    >
                      {t('edit')}
                    </button>
                  ) : null}
                  {user?.role === 'admin' ? (
                    <button
                      type="button"
                      className="reservation-action-btn danger"
                      onClick={() => dispatch(deleteReservation(reservation.id))}
                      title={t('delete')}
                    >
                      {t('delete')}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReservation ? (
        <article className="reservation-details-card reservation-modal">
          <div className="reservation-panel-head">
            <h3>{t('details')}</h3>
            <button type="button" className="reservation-close-btn" onClick={() => setSelectedReservation(null)}>
              ✕
            </button>
          </div>

          <div className="reservation-modal-content">
            <div className="reservation-modal-section">
              <div className="modal-field">
                <span>{t('reservedBy')}</span>
                <strong>{selectedReservation.ownerName}</strong>
              </div>
              <div className="modal-field">
                <span>{t('reservationId')}</span>
                <strong>#{selectedReservation.id}</strong>
              </div>
              <div className="modal-field">
                <span>{t('reservationNumber')}</span>
                <strong className="reservation-id-code">RES-{selectedReservation.code || String(selectedReservation.id).padStart(5, '0')}</strong>
              </div>
            </div>

            <div className="reservation-qr-section">
              <div className="reservation-qr-container">
                <QRCodeSVG
                  value={`RES-${selectedReservation.code || String(selectedReservation.id).padStart(5, '0')}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="reservation-qr-info">
                <strong>QR Code</strong>
                <span>{t('reservationNumber')}</span>
              </div>
            </div>

            <div className="reservation-modal-actions">
              {canCancelSelectedReservation ? (
                <button
                  type="button"
                  className="reservation-btn-cancel"
                  disabled={cancelingReservation}
                  onClick={async () => {
                    if (!selectedReservation || cancelingReservation) {
                      return
                    }

                    setCancelingReservation(true)

                    try {
                      if (user?.role === 'stagiaire') {
                        await dispatch(cancelOwnReservation(selectedReservation.id)).unwrap()
                      } else if (user?.role === 'admin' || user?.role === 'monitor') {
                        await dispatch(updateReservationStatus({ id: selectedReservation.id, status: 'cancelled' })).unwrap()
                      } else {
                        await dispatch(deleteReservation(selectedReservation.id)).unwrap()
                      }

                      setSelectedReservation(null)
                      dispatch(fetchReservations())
                    } catch (error) {
                      window.alert(t('statusChangeFailed'))
                    } finally {
                      setCancelingReservation(false)
                    }
                  }}
                >
                  {cancelingReservation ? t('saving') : 'Annuler Reservation'}
                </button>
              ) : null}
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
                    <td>
                      {index === 0 ? (
                        t('mainReservationOwner')
                      ) : (
                        <button
                          type="button"
                          className="reservation-action-btn danger"
                          disabled={removingPlayerId === player.id}
                          onClick={async () => {
                            if (!playersSourceReservation?.id || removingPlayerId === player.id) {
                              return
                            }

                            setRemovingPlayerId(player.id)
                            setPlayersError('')

                            try {
                              await dispatch(removeReservationPlayer({
                                reservationId: playersSourceReservation.id,
                                playerId: player.id,
                              })).unwrap()

                              await loadPlayersByCode(playersSourceReservation)
                              dispatch(fetchReservations())
                            } catch (error) {
                              setPlayersError(error?.message || 'Impossible de supprimer ce joueur.')
                            } finally {
                              setRemovingPlayerId(null)
                            }
                          }}
                        >
                          {removingPlayerId === player.id ? t('saving') : t('delete')}
                        </button>
                      )}
                    </td>
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
