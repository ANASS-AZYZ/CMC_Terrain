import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createReservation } from '../features/reservations/reservationsSlice'
import { fetchTerrains } from '../features/terrains/terrainsSlice'

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

const ONE_HOUR_SLOTS = [
  { label: '08:00 - 09:00', startHour: 8, endHour: 9 },
  { label: '09:00 - 10:00', startHour: 9, endHour: 10 },
  { label: '10:00 - 11:00', startHour: 10, endHour: 11 },
  { label: '11:00 - 12:00', startHour: 11, endHour: 12 },
  { label: '12:00 - 13:00', startHour: 12, endHour: 13 },
  { label: '13:00 - 14:00', startHour: 13, endHour: 14 },
  { label: '14:00 - 15:00', startHour: 14, endHour: 15 },
  { label: '15:00 - 16:00', startHour: 15, endHour: 16 },
  { label: '16:00 - 17:00', startHour: 16, endHour: 17 },
  { label: '17:00 - 18:00', startHour: 17, endHour: 18 },
]

const TWO_HOUR_SLOTS = [
  { label: '08:00 - 10:00', startHour: 8, endHour: 10 },
  { label: '10:00 - 12:00', startHour: 10, endHour: 12 },
  { label: '12:00 - 14:00', startHour: 12, endHour: 14 },
  { label: '14:00 - 16:00', startHour: 14, endHour: 16 },
  { label: '16:00 - 18:00', startHour: 16, endHour: 18 },
]

export default function StagiaireAvailabilityPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { terrainId } = useParams()
  const terrains = useAppSelector((state) => state.terrains.items)
  const user = useAppSelector((state) => state.auth.user)

  const [selectedDate, setSelectedDate] = useState('')
  const [durationHours, setDurationHours] = useState(1)
  const [selectedSlotLabel, setSelectedSlotLabel] = useState('')
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')
  const [availabilityReservations, setAvailabilityReservations] = useState([])
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    dispatch(fetchTerrains())
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const loadAvailabilityReservations = async () => {
      try {
        const { data } = await api.get('/reservations', {
          params: { for_availability: 1 },
        })

        if (!cancelled) {
          setAvailabilityReservations(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) {
          setAvailabilityReservations([])
        }
      }
    }

    loadAvailabilityReservations()

    return () => {
      cancelled = true
    }
  }, [])

  const terrain = useMemo(
    () => terrains.find((item) => item.id === Number(terrainId)),
    [terrains, terrainId],
  )

  const availableSlots = useMemo(() => {
    if (!selectedDate || !terrainId) return []

    const now = new Date()
    const sourceSlots = durationHours === 1 ? ONE_HOUR_SLOTS : TWO_HOUR_SLOTS

    return sourceSlots.filter((slot) => {
      const slotStart = new Date(`${selectedDate}T00:00:00`)
      slotStart.setHours(slot.startHour, 0, 0, 0)

      const slotEnd = new Date(`${selectedDate}T00:00:00`)
      slotEnd.setHours(slot.endHour, 0, 0, 0)

      if (slotStart < now) return false

      const overlap = availabilityReservations.some((reservation) => {
        if (Number(reservation.terrain_id) !== Number(terrainId)) return false
        if (['cancelled', 'rejected', 'completed'].includes(String(reservation.status || ''))) return false

        const starts = new Date(reservation.starts_at)
        const ends = new Date(reservation.ends_at)
        return starts < slotEnd && ends > slotStart
      })

      return !overlap
    })
  }, [selectedDate, durationHours, availabilityReservations, terrainId])

  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const displayedMonthLabel = `${MONTH_NAMES[displayedMonth.getMonth()]} ${displayedMonth.getFullYear()}`

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null

  const calendarCells = useMemo(() => {
    const year = displayedMonth.getFullYear()
    const month = displayedMonth.getMonth()
    const firstWeekDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const cells = []

    for (let i = 0; i < firstWeekDay; i += 1) {
      cells.push({ key: `blank-${i}`, blank: true })
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dateObj = new Date(year, month, day)
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      cells.push({
        key: dateKey,
        blank: false,
        day,
        dateKey,
        isPast: dateObj < today,
      })
    }

    return cells
  }, [displayedMonth, today])

  useEffect(() => {
    setSelectedSlotLabel('')
    setReserveError('')
  }, [selectedDate, durationHours])

  const onReserveSelectedSlot = async () => {
    const pickedSlot = (durationHours === 1 ? ONE_HOUR_SLOTS : TWO_HOUR_SLOTS).find((slot) => slot.label === selectedSlotLabel)
    if (!pickedSlot || !selectedDate) return

    const startsAt = new Date(`${selectedDate}T00:00:00`)
    startsAt.setHours(pickedSlot.startHour, 0, 0, 0)

    const endsAt = new Date(`${selectedDate}T00:00:00`)
    endsAt.setHours(pickedSlot.endHour, 0, 0, 0)

    const [firstName = '', ...rest] = String(user?.name || '').trim().split(' ')
    const lastName = rest.join(' ').trim()
    const studentName = String(user?.name || '').trim() || `${firstName} ${lastName}`.trim()

    if (!studentName || !user?.email) {
      setReserveError(t('profileDataIncomplete'))
      return
    }

    setReserving(true)
    setReserveError('')

    const payload = {
      terrain_id: Number(terrainId),
      match_id: null,
      first_name: user?.first_name || firstName || null,
      last_name: user?.last_name || lastName || null,
      student_name: studentName,
      cin: user?.cin || null,
      student_email: user.email,
      class_name: user?.class_name || null,
      filiere: user?.filiere || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'pending',
    }

    const result = await dispatch(createReservation(payload))

    setReserving(false)

    if (createReservation.rejected.match(result)) {
      const apiMessage = typeof result.payload === 'string' && result.payload.trim()
        ? result.payload
        : null
      setReserveError(apiMessage || t('reservationFailedSlotTaken'))
      return
    }

    navigate('/stagiaire/my-reservations')
  }

  return (
    <section className="availability-page">
      <div className="availability-header">
        <button type="button" className="reservation-btn-cancel" onClick={() => navigate('/stagiaire/home')}>
          {t('back')}
        </button>
        <div>
          <h2>{t('fieldScheduleAvailability')}</h2>
          <p>{terrain ? `${terrain.name} - ${t('chooseDayAndSlot')}` : t('terrainAvailabilitySelection')}</p>
        </div>
      </div>

      <div className="availability-layout">
        <aside className="availability-date-column">
          <div className="availability-date-card">
            <div className="availability-date-head">
              <h3>Select Date</h3>
              <div className="availability-month-nav">
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={() => setDisplayedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={() => setDisplayedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  ›
                </button>
              </div>
            </div>

            <p className="calendar-month-label">{displayedMonthLabel}</p>

            <div className="calendar-week-row">
              {WEEK_DAYS.map((weekDay) => (
                <span key={weekDay}>{weekDay}</span>
              ))}
            </div>

            <div className="calendar-days-grid">
              {calendarCells.map((cell) => {
                if (cell.blank) {
                  return <span key={cell.key} className="calendar-day-empty" />
                }

                const isSelected = selectedDateObj
                  ? selectedDateObj.getFullYear() === displayedMonth.getFullYear()
                    && selectedDateObj.getMonth() === displayedMonth.getMonth()
                    && selectedDateObj.getDate() === cell.day
                  : false

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={isSelected ? 'calendar-day-btn selected' : 'calendar-day-btn'}
                    disabled={cell.isPast}
                    onClick={() => setSelectedDate(cell.dateKey)}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>

            <div className="availability-legend">
              <p><span className="dot available" /> {t('available')}</p>
              <p><span className="dot reserved" /> {t('reserved')}</p>
              <p><span className="dot closed" /> {t('closed')}</p>
            </div>
          </div>

          <div className="booking-window-alert">
            <strong>{t('bookingWindowOpen')}</strong>
            <span>{t('bookingWindowHint')}</span>
          </div>
        </aside>

        <section className="availability-slots-card">
          <div className="availability-slots-head">
            <h3>{selectedDate ? t('availableSlotsFound', { count: availableSlots.length }) : t('availableSlotsFound', { count: 0 })}</h3>
            <div className="availability-duration-toggle">
              <button
                type="button"
                className={durationHours === 1 ? 'duration-btn active' : 'duration-btn'}
                onClick={() => setDurationHours(1)}
              >
                1h
              </button>
              <button
                type="button"
                className={durationHours === 2 ? 'duration-btn active' : 'duration-btn'}
                onClick={() => setDurationHours(2)}
              >
                2h
              </button>
            </div>
          </div>

          {!selectedDate ? (
            <p className="availability-empty">{t('selectDate')}</p>
          ) : availableSlots.length === 0 ? (
            <p className="availability-empty">{t('noSlotsForDay')}</p>
          ) : (
            <div className="availability-slots-grid">
              {availableSlots.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  className={selectedSlotLabel === slot.label ? 'availability-slot-btn selected' : 'availability-slot-btn'}
                  onClick={() => setSelectedSlotLabel(slot.label)}
                >
                  <strong>{slot.label}</strong>
                  <span>{t('clickToSelect')}</span>
                </button>
              ))}
            </div>
          )}

          {selectedSlotLabel ? (
            <div className="availability-reserve-actions">
              <p>
                {t('selectedSlot')}: <strong>{selectedSlotLabel}</strong>
              </p>
              <button type="button" className="reserve-card-btn" onClick={onReserveSelectedSlot} disabled={reserving}>
                {reserving ? t('reserving') : t('reserve')}
              </button>
            </div>
          ) : null}

          {reserveError ? <p className="availability-error">{reserveError}</p> : null}
        </section>
      </div>
    </section>
  )
}
