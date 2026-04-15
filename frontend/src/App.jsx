import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function App() {
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    link: '',
    categorySlug: '',
    examDate: '',
    lastDate: '',
    status: 'Open',
    isFeatured: false,
    attachment: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [categoryResponse, postResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/posts`),
        fetch(`${API_BASE}/api/stats`),
      ])

      if (!categoryResponse.ok || !postResponse.ok || !statsResponse.ok) {
        throw new Error('API response failed. Ensure backend is running.')
      }

      const [categoryJson, postJson, statsJson] = await Promise.all([
        categoryResponse.json(),
        postResponse.json(),
        statsResponse.json(),
      ])

      setCategories(categoryJson)
      setPosts(postJson)
      setStats(statsJson)
      setFormState((currentState) => ({
        ...currentState,
        categorySlug:
          currentState.categorySlug || categoryJson[0]?.slug || '',
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const featuredPosts = useMemo(
    () => posts.filter((post) => post.isFeatured).slice(0, 6),
    [posts],
  )

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') {
      return posts
    }

    return posts.filter((post) => post.category?.slug === activeCategory)
  }, [activeCategory, posts])

  const formatDate = (value) => {
    if (!value) {
      return '-'
    }
    return new Date(value).toLocaleDateString('en-IN')
  }

  const resolveAssetUrl = (value) => {
    if (!value) {
      return ''
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value
    }

    return `${API_BASE}${value}`
  }

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target

    setFormState((currentState) => ({
      ...currentState,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitMessage('')

    try {
      const payload = new FormData()

      Object.entries(formState).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          return
        }

        if (typeof value === 'boolean') {
          payload.append(key, String(value))
          return
        }

        payload.append(key, value)
      })

      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        body: payload,
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.detail || json.message || 'Unable to create post')
      }

      setSubmitMessage('Notice created successfully.')
      setFormState({
        title: '',
        description: '',
        link: '',
        categorySlug: categories[0]?.slug || '',
        examDate: '',
        lastDate: '',
        status: 'Open',
        isFeatured: false,
        attachment: null,
      })
      await loadData()
    } catch (submitError) {
      setSubmitMessage(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__text">
          <p className="eyebrow">Government Jobs Portal</p>
          <h1>Sarkari Jankari</h1>
          <p className="lead">
            Real-time latest jobs, results, admit cards and exam notices with a
            React frontend + Express/Prisma API backend.
          </p>
        </div>
        <div className="hero__stats">
          <div className="stat-card">
            <span>Total Updates</span>
            <strong>{stats?.postCount ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Featured</span>
            <strong>{stats?.featuredCount ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Results</span>
            <strong>{stats?.resultCount ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Admit Cards</span>
            <strong>{stats?.admitCardCount ?? 0}</strong>
          </div>
        </div>
      </header>

      <section className="category-bar">
        <button
          type="button"
          className={activeCategory === 'all' ? 'active' : ''}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={activeCategory === category.slug ? 'active' : ''}
            onClick={() => setActiveCategory(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </section>

      {loading ? <p className="feedback">Loading updates...</p> : null}
      {error ? <p className="feedback feedback--error">{error}</p> : null}

      <section className="featured">
        <h2>Top Notifications</h2>
        <div className="featured__grid">
          {featuredPosts.map((post) => (
            <article key={post.id} className="featured-card">
              <p
                className="tag"
                style={{
                  backgroundColor: `${post.category?.color || '#e11d48'}20`,
                  color: post.category?.color || '#e11d48',
                }}
              >
                {post.category?.name}
              </p>
              <h3>{post.title}</h3>
              <p>{post.description || 'Latest official notification update.'}</p>
              {post.attachmentType?.startsWith('image/') ? (
                <img
                  className="featured-card__image"
                  src={resolveAssetUrl(post.attachmentUrl)}
                  alt={post.attachmentName || post.title}
                />
              ) : null}
              {post.attachmentUrl ? (
                <a href={resolveAssetUrl(post.attachmentUrl)} target="_blank" rel="noreferrer">
                  {post.attachmentType === 'application/pdf' ? 'View PDF' : 'View Attachment'}
                </a>
              ) : null}
              <a href={resolveAssetUrl(post.link)} target="_blank" rel="noreferrer">
                Open Notice
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="table-wrap">
        <h2>All Updates</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Exam Date</th>
                <th>Last Date</th>
                <th>Attachment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <a href={resolveAssetUrl(post.link)} target="_blank" rel="noreferrer">
                      {post.title}
                    </a>
                  </td>
                  <td>{post.category?.name}</td>
                  <td>{formatDate(post.examDate)}</td>
                  <td>{formatDate(post.lastDate)}</td>
                  <td>
                    {post.attachmentUrl ? (
                      <a href={resolveAssetUrl(post.attachmentUrl)} target="_blank" rel="noreferrer">
                        {post.attachmentType === 'application/pdf' ? 'PDF' : 'Image'}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{post.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-wrap uploader">
        <div className="uploader__header">
          <div>
            <h2>Publish Notice</h2>
            <p>Add a job update with an external link, image, or PDF attachment.</p>
          </div>
          <p className="uploader__hint">Max upload size: 8 MB</p>
        </div>

        <form className="uploader__form" onSubmit={handleSubmit}>
          <label>
            <span>Title</span>
            <input name="title" value={formState.title} onChange={handleChange} required />
          </label>

          <label>
            <span>Category</span>
            <select
              name="categorySlug"
              value={formState.categorySlug}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="uploader__wide">
            <span>Description</span>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows="4"
            />
          </label>

          <label>
            <span>Official Link</span>
            <input
              name="link"
              type="url"
              value={formState.link}
              onChange={handleChange}
              placeholder="https://example.com/notice"
            />
          </label>

          <label>
            <span>Attachment</span>
            <input
              name="attachment"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Exam Date</span>
            <input name="examDate" type="date" value={formState.examDate} onChange={handleChange} />
          </label>

          <label>
            <span>Last Date</span>
            <input name="lastDate" type="date" value={formState.lastDate} onChange={handleChange} />
          </label>

          <label>
            <span>Status</span>
            <input name="status" value={formState.status} onChange={handleChange} />
          </label>

          <label className="uploader__checkbox">
            <input
              name="isFeatured"
              type="checkbox"
              checked={formState.isFeatured}
              onChange={handleChange}
            />
            <span>Mark as featured</span>
          </label>

          <button className="uploader__submit" type="submit" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Notice'}
          </button>
        </form>

        {submitMessage ? (
          <p className={`feedback ${submitMessage.includes('successfully') ? '' : 'feedback--error'}`}>
            {submitMessage}
          </p>
        ) : null}
      </section>
    </div>
  )
}

export default App
