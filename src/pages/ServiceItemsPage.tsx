import { useEffect, useState, type FormEvent } from 'react'
import { createServiceItem, listServiceItems, updateServiceItem } from '../api/client'
import type { ServiceItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'

const GROUPS = ['periodic', 'chassis', 'engine']

export function ServiceItemsPage() {
  const { token, isAdmin } = useAuth()
  const [items, setItems] = useState<ServiceItem[]>([])
  const [group, setGroup] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [newGroup, setNewGroup] = useState('periodic')

  async function refresh() {
    if (!token) return
    setLoading(true)
    try {
      const data = await listServiceItems(token, group || undefined)
      setItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [token, group])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!token || !isAdmin) return
    try {
      await createServiceItem(token, { code: code.trim(), name: name.trim(), group: newGroup })
      setCode('')
      setName('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create item')
    }
  }

  async function toggleActive(item: ServiceItem) {
    if (!token || !isAdmin) return
    try {
      await updateServiceItem(token, item.id, { isActive: !item.isActive })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Service items</h1>
          <p className="muted">Canonical catalogue used on history lines and the price book.</p>
        </div>
        <label>
          Filter group
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
      </header>

      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <form className="panel form-grid" onSubmit={onCreate}>
          <h2 className="full">Add item</h2>
          <label>
            Code
            <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="engine-oil-filter" />
          </label>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Engine oil & filter" />
          </label>
          <label>
            Group
            <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)}>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          <button type="submit">Create</button>
        </form>
      )}

      <section className="panel">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Status</th>
                  {isAdmin && <th />}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.code}</code></td>
                    <td>{item.name}</td>
                    <td>{item.group}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    {isAdmin && (
                      <td>
                        <button type="button" className="ghost" onClick={() => toggleActive(item)}>
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
