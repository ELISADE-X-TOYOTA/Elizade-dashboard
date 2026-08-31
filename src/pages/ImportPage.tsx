import { useState, type FormEvent } from 'react'
import { downloadImportTemplate, previewPriceImport, publishPriceImport } from '../api/client'
import type { PriceImportPreview, PriceImportPublish } from '../api/types'
import { useAuth } from '../auth/AuthContext'

export function ImportPage() {
  const { token, isAdmin } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [disclaimer, setDisclaimer] = useState('')
  const [preview, setPreview] = useState<PriceImportPreview | null>(null)
  const [published, setPublished] = useState<PriceImportPublish | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isAdmin) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Import & publish</h1>
        </header>
        <section className="panel">
          <p>Only admins can import and publish price books.</p>
        </section>
      </div>
    )
  }

  async function onDownloadTemplate() {
    if (!token) return
    setError(null)
    try {
      const blob = await downloadImportTemplate(token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'elizade-service-price-import-template.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download template')
    }
  }

  async function onPreview(e: FormEvent) {
    e.preventDefault()
    if (!token || !file) return
    setLoading(true)
    setError(null)
    setPublished(null)
    try {
      const result = await previewPriceImport(token, file)
      setPreview(result)
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  async function onPublish() {
    if (!token || !file) return
    setLoading(true)
    setError(null)
    try {
      const result = await publishPriceImport(token, file, { disclaimer: disclaimer || undefined })
      setPublished(result)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Import & publish</h1>
          <p className="muted">Upload a CSV, preview validation, then publish a new version.</p>
        </div>
        <button type="button" className="secondary" onClick={onDownloadTemplate}>
          Download template
        </button>
      </header>

      {error && <p className="error">{error}</p>}
      {published && (
        <section className="panel success">
          Published version {published.versionNumber} with {published.entryCount} prices at{' '}
          {new Date(published.publishedAt).toLocaleString()}.
        </section>
      )}

      <form className="panel form-grid" onSubmit={onPreview}>
        <label className="full">
          CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setPreview(null)
              setPublished(null)
            }}
            required
          />
        </label>
        <label className="full">
          Disclaimer (optional, applied on publish)
          <textarea
            value={disclaimer}
            onChange={(e) => setDisclaimer(e.target.value)}
            rows={3}
            placeholder="Prices are indicative and subject to confirmation at booking."
          />
        </label>
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Working…' : 'Preview import'}
        </button>
      </form>

      {preview && (
        <section className="panel">
          <h2>Preview</h2>
          <div className="preview-stats">
            <span>{preview.valid} valid</span>
            <span>{preview.failed} failed</span>
            <span>{preview.duplicateCellsInFile} duplicate cells</span>
            {preview.replacesPublishedVersion && (
              <span>Replaces published v{preview.currentPublishedVersion}</span>
            )}
          </div>

          {preview.errors.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.errors.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td>{row.errors.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.valid > 0 && preview.failed === 0 && (
            <button type="button" onClick={onPublish} disabled={loading}>
              Publish {preview.valid} prices
            </button>
          )}
        </section>
      )}
    </div>
  )
}
