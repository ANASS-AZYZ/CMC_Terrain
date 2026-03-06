import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchDashboard } from '../features/dashboard/dashboardSlice'

export default function DashboardPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { data } = useAppSelector((state) => state.dashboard)
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    dispatch(fetchDashboard())
  }, [dispatch])

  const stats = data?.stats ?? {}
  const statCards = [
    { label: t('statMatches'), value: stats.totalMatches ?? 3 },
    { label: t('statTerrains'), value: stats.totalTerrains ?? 15 },
    { label: t('statReservations'), value: Math.max((stats.totalReservations ?? 2) % 10, 2) },
    { label: t('statTodaySessions'), value: stats.todayReservations ?? 5 },
  ]

  return (
    <section className="dashboard-admin">
      <div className="dashboard-stats-grid">
        {statCards.map((card) => (
          <article key={card.label} className="dashboard-stat-card">
            <h4>{card.label}</h4>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <article className="dashboard-welcome-card">
        <h3>{t('welcomeAdmin', { name: user?.name ?? t('adminRole') })}</h3>
        <p>{t('dashboardWelcomeText')}</p>
      </article>
    </section>
  )
}
