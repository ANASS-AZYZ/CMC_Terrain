import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createMatch, fetchMatches } from '../features/matches/matchesSlice'
import { fetchTerrains } from '../features/terrains/terrainsSlice'

export default function MatchesPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const matches = useAppSelector((state) => state.matches.items)
  const terrains = useAppSelector((state) => state.terrains.items)
  const [title, setTitle] = useState('Campus Match')

  useEffect(() => {
    dispatch(fetchMatches())
    dispatch(fetchTerrains())
  }, [dispatch])

  const terrainId = terrains[0]?.id

  const submit = async (e) => {
    e.preventDefault()
    if (!terrainId) {
      return
    }

    const starts = new Date()
    const ends = new Date(starts.getTime() + 90 * 60000)

    await dispatch(
      createMatch({
        title,
        terrain_id: terrainId,
        team_a: 'Team A',
        team_b: 'Team B',
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: 'scheduled',
      }),
    )
  }

  return (
    <section>
      <h2>{t('matches')}</h2>
      <form className="inline-form" onSubmit={submit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <button type="submit" disabled={!terrainId}>
          {t('add')}
        </button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Terrain</th>
              <th>Teams</th>
              <th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id}>
                <td>{match.title}</td>
                <td>{match.terrain?.name ?? match.terrain_id}</td>
                <td>
                  {match.team_a} vs {match.team_b}
                </td>
                <td>{match.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
