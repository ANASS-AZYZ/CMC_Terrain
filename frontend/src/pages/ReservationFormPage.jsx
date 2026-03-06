import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createReservation, fetchReservations, updateReservation } from '../features/reservations/reservationsSlice'
import { fetchTerrains } from '../features/terrains/terrainsSlice'

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

const defaultForm = {
  first_name: '',
  last_name: '',
  cin: '',
  student_email: '',
  class_name: '',
  filiere: '',
  terrain_id: '',
}

export default function ReservationFormPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { reservationId } = useParams()
  const [searchParams] = useSearchParams()
  const user = useAppSelector((state) => state.auth.user)
  const terrains = useAppSelector((state) => state.terrains.items)
  const reservations = useAppSelector((state) => state.reservations.items)
  const isEdit = Boolean(reservationId)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [selectedTerrainType, setSelectedTerrainType] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [slotDuration, setSlotDuration] = useState(2)
  const [joinReservationCode, setJoinReservationCode] = useState('')

  useEffect(() => {
    dispatch(fetchTerrains())
    dispatch(fetchReservations())
  }, [dispatch])

  const currentReservation = useMemo(
    () => reservations.find((reservation) => reservation.id === Number(reservationId)),
    [reservations, reservationId],
  )

  const activeTerrains = useMemo(
    () => terrains.filter((terrain) => terrain.status === 'active' && terrain.online_booking !== false),
    [terrains],
  )

  useEffect(() => {
    if (isEdit) return

    const queryTerrainId = Number(searchParams.get('terrainId'))
    if (!queryTerrainId) return

    const terrain = activeTerrains.find((item) => item.id === queryTerrainId)
    if (!terrain) return

    setSelectedTerrainType(String(terrain.type || ''))
    setForm((prev) => ({ ...prev, terrain_id: String(terrain.id) }))
  }, [activeTerrains, isEdit, searchParams])

  useEffect(() => {
    if (isEdit) return
    if (searchParams.get('joinCode')) return

    const queryDate = searchParams.get('date')
    const queryDuration = Number(searchParams.get('duration'))
    const querySlot = searchParams.get('slot')

    if (queryDate) {
      setSelectedDate(queryDate)
    }

    if (queryDuration === 1 || queryDuration === 2) {
      setSlotDuration(queryDuration)
    }

    if (querySlot) {
      setSelectedSlot(querySlot)
    }
  }, [isEdit, searchParams])

  useEffect(() => {
    if (isEdit) return

    const joinCode = searchParams.get('joinCode')
    if (!joinCode) return

    let canceled = false

    const loadJoinReservation = async () => {
      try {
        const { data } = await api.get(`/reservations/code/${encodeURIComponent(joinCode)}`)
        if (canceled || !data?.reservation) return

        const source = data.reservation
        const starts = new Date(source.starts_at)
        const ends = new Date(source.ends_at)
        const durationHours = Math.max(1, Math.min(2, Math.round((ends - starts) / 3600000)))

        const selectedSlots = durationHours === 1 ? ONE_HOUR_SLOTS : TWO_HOUR_SLOTS
        const matchedSlot = selectedSlots.find((slot) => slot.startHour === starts.getHours() && slot.endHour === ends.getHours())

        const isoDate = new Date(starts.getTime() - starts.getTimezoneOffset() * 60000).toISOString().split('T')[0]
        const terrain = activeTerrains.find((item) => item.id === Number(source.terrain_id))

        setJoinReservationCode(source.reservation_code || joinCode)
        setSelectedDate(isoDate)
        setSlotDuration(durationHours)
        setSelectedSlot(matchedSlot?.label ?? '')

        if (terrain) {
          setSelectedTerrainType(String(terrain.type || ''))
          setForm((prev) => ({ ...prev, terrain_id: String(terrain.id) }))
        }
      } catch {
        setJoinReservationCode('')
      }
    }

    loadJoinReservation()

    return () => {
      canceled = true
    }
  }, [activeTerrains, isEdit, searchParams])

  const terrainTypes = useMemo(
    () => [...new Set(activeTerrains.map((terrain) => String(terrain.type || '').trim()).filter(Boolean))],
    [activeTerrains],
  )

  const filteredTerrains = useMemo(() => {
    if (!selectedTerrainType) return activeTerrains
    return activeTerrains.filter((terrain) => String(terrain.type || '').trim() === selectedTerrainType)
  }, [activeTerrains, selectedTerrainType])

  useEffect(() => {
    if (!selectedTerrainType && terrainTypes[0]) {
      setSelectedTerrainType(terrainTypes[0])
    }
  }, [terrainTypes, selectedTerrainType])

  useEffect(() => {
    if (!filteredTerrains.length) {
      setForm((prev) => ({ ...prev, terrain_id: '' }))
      return
    }

    const exists = filteredTerrains.some((terrain) => String(terrain.id) === String(form.terrain_id))
    if (!exists) {
      setForm((prev) => ({ ...prev, terrain_id: String(filteredTerrains[0].id) }))
    }
  }, [filteredTerrains, form.terrain_id])

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const backPath = user?.role === 'stagiaire' ? '/stagiaire/my-reservations' : '/admin/reservations'

  const todayDateStr = new Date().toISOString().split('T')[0]

  const availableSlots = useMemo(() => {
    if (!selectedDate || !form.terrain_id) return []

    const chosenTerrainId = Number(form.terrain_id)
    const now = new Date()
    const baseSlots = slotDuration === 1 ? ONE_HOUR_SLOTS : TWO_HOUR_SLOTS

    return baseSlots.filter((slot) => {
      const slotStart = new Date(`${selectedDate}T00:00:00`)
      slotStart.setHours(slot.startHour, 0, 0, 0)

      const slotEnd = new Date(`${selectedDate}T00:00:00`)
      slotEnd.setHours(slot.endHour, 0, 0, 0)

      if (slotStart < now) return false

      const overlap = reservations.some((reservation) => {
        if (Number(reservation.terrain_id) !== chosenTerrainId) return false

        const starts = new Date(reservation.starts_at)
        const ends = new Date(reservation.ends_at)
        return starts < slotEnd && ends > slotStart
      })

      return !overlap
    })
  }, [selectedDate, form.terrain_id, reservations, slotDuration])

  useEffect(() => {
    if (!isEdit || !currentReservation) return

    const starts = new Date(currentReservation.starts_at)
    const ends = new Date(currentReservation.ends_at)
    const durationHours = Math.max(1, Math.min(2, Math.round((ends - starts) / 3600000)))

    const selectedSlots = durationHours === 1 ? ONE_HOUR_SLOTS : TWO_HOUR_SLOTS
    const matchedSlot = selectedSlots.find((slot) => slot.startHour === starts.getHours() && slot.endHour === ends.getHours())

    const isoDate = new Date(starts.getTime() - starts.getTimezoneOffset() * 60000).toISOString().split('T')[0]

    setForm({
      first_name: currentReservation.first_name ?? currentReservation.student_name?.split(' ')[0] ?? '',
      last_name: currentReservation.last_name ?? currentReservation.student_name?.split(' ').slice(1).join(' ') ?? '',
      cin: currentReservation.cin ?? '',
      student_email: currentReservation.student_email ?? '',
      class_name: currentReservation.class_name ?? '',
      filiere: currentReservation.filiere ?? '',
      terrain_id: String(currentReservation.terrain_id ?? ''),
    })

    const terrain = terrains.find((item) => item.id === Number(currentReservation.terrain_id))
    setSelectedTerrainType(String(terrain?.type || ''))

    setSelectedDate(isoDate)
    setSlotDuration(durationHours)
    setSelectedSlot(matchedSlot?.label ?? '')
  }, [isEdit, currentReservation, terrains])

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedSlot('')
      return
    }

    const exists = availableSlots.some((slot) => slot.label === selectedSlot)
    if (!exists) {
      setSelectedSlot(availableSlots[0].label)
    }
  }, [availableSlots, selectedSlot])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const sourceSlots = slotDuration === 1 ? ONE_HOUR_SLOTS : TWO_HOUR_SLOTS
    const pickedSlot = sourceSlots.find((slot) => slot.label === selectedSlot)
    if (!selectedDate || !pickedSlot || availableSlots.length === 0) {
      setSaving(false)
      return
    }

    const startsAt = new Date(`${selectedDate}T00:00:00`)
    startsAt.setHours(pickedSlot.startHour, 0, 0, 0)

    const endsAt = new Date(`${selectedDate}T00:00:00`)
    endsAt.setHours(pickedSlot.endHour, 0, 0, 0)

    const payload = {
      terrain_id: Number(form.terrain_id),
      match_id: null,
      join_reservation_code: joinReservationCode || null,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      student_name: `${form.first_name} ${form.last_name}`.trim(),
      cin: form.cin.trim(),
      student_email: form.student_email.trim(),
      class_name: form.class_name.trim(),
      filiere: form.filiere.trim(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'pending',
    }

    if (isEdit) {
      await dispatch(updateReservation({ id: Number(reservationId), payload }))
    } else {
      await dispatch(createReservation(payload))
    }

    setSaving(false)
    navigate(backPath)
  }

  return (
    <section className="reservation-form-page">
      <div className="reservation-form-header">
        <h2>{isEdit ? t('editReservation') : t('addReservation')}</h2>
        <p>{isEdit ? t('updateReservationInfo') : t('createReservationWithStudentData')}</p>
      </div>

      <form className="reservation-form-card" onSubmit={onSubmit}>
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
          {t('email')}
          <input
            type="email"
            value={form.student_email}
            onChange={(e) => onChange('student_email', e.target.value)}
            placeholder={t('emailPlaceholder')}
            required
          />
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
          {t('terrainType')}
          <select value={selectedTerrainType} onChange={(e) => setSelectedTerrainType(e.target.value)} required>
            {terrainTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t('terrainActive')}
          <select value={form.terrain_id} onChange={(e) => onChange('terrain_id', e.target.value)} required>
            {filteredTerrains.map((terrain) => (
              <option key={terrain.id} value={terrain.id}>
                {terrain.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t('dateReservation')}
          <input type="date" min={todayDateStr} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
        </label>

        <label>
          {t('duration')}
          <div className="reservation-duration-toggle">
            <button
              type="button"
              className={slotDuration === 1 ? 'duration-btn active' : 'duration-btn'}
              onClick={() => setSlotDuration(1)}
            >
              1h
            </button>
            <button
              type="button"
              className={slotDuration === 2 ? 'duration-btn active' : 'duration-btn'}
              onClick={() => setSlotDuration(2)}
            >
              2h
            </button>
          </div>
        </label>

        <label>
          {t('availableSlotMax2h')}
          <select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} required>
            <option value="" disabled>
              {t('chooseSlot')}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot.label} value={slot.label}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>

        {selectedDate && availableSlots.length === 0 ? <p className="reservation-slot-hint">{t('noSlotsForDay')}</p> : null}

        <div className="reservation-form-actions">
          <button type="button" className="reservation-btn-cancel" onClick={() => navigate(backPath)}>
            {t('cancel')}
          </button>
          <button type="submit" className="reservation-btn-save" disabled={saving || filteredTerrains.length === 0 || !selectedDate || !selectedSlot}>
            {saving ? t('saving') : isEdit ? t('editReservation') : t('createReservation')}
          </button>
        </div>
      </form>
    </section>
  )
}
