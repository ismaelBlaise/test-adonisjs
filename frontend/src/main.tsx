import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { api, ApiError, resolveAssetUrl } from './api'
import coverGallery from './assets/cover-gallery.svg'
import coverNotes from './assets/cover-notes.svg'
import coverWorkspace from './assets/cover-workspace.svg'
import { ComposerModal } from './components/ComposerModal'
import { formatClockTime, formatPublicationTime, formatRelativeTime } from './formatters'
import type { AuthPayload, PostDto } from './types'
import './styles.css'

const AUTH_STORAGE_KEY = 'adonis_blog_auth'
const LIKES_STORAGE_KEY = 'adonis_blog_likes'
const VIEWS_STORAGE_KEY = 'adonis_blog_viewed_posts'
const REFRESH_INTERVAL = 15000
const MAX_GALLERY_IMAGES = 12

const fallbackImages = [
  coverNotes,
  coverWorkspace,
  coverGallery,
]

function readAuth() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AuthPayload
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function readLikedPosts() {
  return readNumberList(LIKES_STORAGE_KEY)
}

function readViewedPosts() {
  return readNumberList(VIEWS_STORAGE_KEY, sessionStorage)
}

function readNumberList(key: string, storage: Storage = localStorage) {
  const stored = storage.getItem(key)

  if (!stored) {
    return []
  }

  try {
    return JSON.parse(stored) as number[]
  } catch {
    storage.removeItem(key)
    return []
  }
}

function App() {
  const [auth, setAuth] = useState<AuthPayload | null>(() => readAuth())
  const [posts, setPosts] = useState<PostDto[]>([])
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null)
  const [likedPosts, setLikedPosts] = useState<number[]>(() => readLikedPosts())
  const [viewedPosts, setViewedPosts] = useState<number[]>(() => readViewedPosts())
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('Pret pour publier.')
  const [search, setSearch] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const selectedPostIdRef = useRef<number | null>(null)
  const viewedPostsRef = useRef(viewedPosts)
  const loadingRef = useRef(false)
  const token = auth?.token

  useEffect(() => {
    selectedPostIdRef.current = selectedPost?.id ?? null
  }, [selectedPost?.id])

  useEffect(() => {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedPosts))
  }, [likedPosts])

  useEffect(() => {
    viewedPostsRef.current = viewedPosts
    sessionStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(viewedPosts))
  }, [viewedPosts])

  const selectedImage = useMemo(() => {
    if (!selectedPost) {
      return fallbackImages[0]
    }

    return (
      resolveAssetUrl(selectedPost.coverImageUrl) ??
      fallbackImages[selectedPost.id % fallbackImages.length]
    )
  }, [selectedPost])

  const stats = useMemo(() => {
    return posts.reduce(
      (total, post) => ({
        views: total.views + post.viewsCount,
        likes: total.likes + post.likesCount,
        comments: total.comments + post.commentsCount,
      }),
      { views: 0, likes: 0, comments: 0 }
    )
  }, [posts])

  const openPost = useCallback(async (id: number, countView = true) => {
    const shouldRecordView = countView && !viewedPostsRef.current.includes(id)

    if (shouldRecordView) {
      const nextViewedPosts = [...viewedPostsRef.current, id]
      viewedPostsRef.current = nextViewedPosts
      setViewedPosts(nextViewedPosts)

      try {
        await api.recordView(id)
      } catch (error) {
        const rolledBackPosts = viewedPostsRef.current.filter((postId) => postId !== id)
        viewedPostsRef.current = rolledBackPosts
        setViewedPosts(rolledBackPosts)
        throw error
      }
    }

    const post = await api.getPost(id)
    setSelectedPost(post)
  }, [])

  const loadPosts = useCallback(
    async (options: { silent?: boolean; query?: string } = {}) => {
      if (loadingRef.current) {
        return
      }

      loadingRef.current = true
      const silent = options.silent ?? false

      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoadingPosts(true)
      }

      try {
        const freshPosts = await api.listPosts(options.query ?? search)
        setPosts(freshPosts)
        setLastSync(new Date())

        const currentId = selectedPostIdRef.current
        const nextSelected = currentId
          ? freshPosts.find((post) => post.id === currentId)
          : freshPosts[0]

        if (nextSelected) {
          const post = await api.getPost(nextSelected.id)
          setSelectedPost(post)
          return
        }

        setSelectedPost(null)
      } catch (error) {
        setMessage(toErrorMessage(error))
      } finally {
        loadingRef.current = false
        setIsLoadingPosts(false)
        setIsRefreshing(false)
      }
    },
    [search]
  )

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useEffect(() => {
    if (!token) {
      return
    }

    api.profile(token).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        persistAuth(null, 'Session expiree. Connecte-toi a nouveau.')
      }
    })
  }, [token])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        loadPosts({ silent: true })
      }
    }, REFRESH_INTERVAL)

    const refreshOnFocus = () => {
      if (!document.hidden && navigator.onLine) {
        loadPosts({ silent: true })
      }
    }

    const markOnline = () => {
      setIsOnline(true)
      setMessage('Connexion retablie. Synchronisation en cours.')
      loadPosts({ silent: true })
    }

    const markOffline = () => {
      setIsOnline(false)
      setMessage('Tu es hors ligne. Les donnees restent visibles.')
    }

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [loadPosts])

  function persistAuth(payload: AuthPayload | null, nextMessage?: string) {
    setAuth(payload)

    if (payload) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
      setMessage(nextMessage ?? `Bienvenue ${payload.user.fullName ?? payload.user.email}.`)
      return
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
    setMessage(nextMessage ?? 'Session terminee.')
  }

  async function handleLogout() {
    if (token) {
      api.logout(token).catch(() => undefined)
    }

    persistAuth(null)
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    setIsSaving(true)

    try {
      const payload =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.signup({
              fullName: String(form.get('fullName') ?? '').trim(),
              email,
              password,
              passwordConfirmation: String(form.get('passwordConfirmation') ?? ''),
            })

      persistAuth(payload)
      event.currentTarget.reset()
    } catch (error) {
      setMessage(toErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadPosts({ query: search })
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setMessage('Connecte-toi pour publier.')
      return
    }

    const form = new FormData(event.currentTarget)
    form.set('title', String(form.get('title') ?? '').trim())
    form.set('excerpt', String(form.get('excerpt') ?? '').trim())
    form.set('body', String(form.get('body') ?? '').trim())
    form.set('isPublished', form.get('isPublished') === 'on' ? 'true' : 'false')

    const coverImage = form.get('coverImage')
    if (coverImage instanceof File && coverImage.size === 0) {
      form.delete('coverImage')
    }

    const galleryImages = form
      .getAll('images')
      .filter((image) => !(image instanceof File) || image.size > 0)

    if (galleryImages.length > MAX_GALLERY_IMAGES) {
      setMessage(`La galerie accepte ${MAX_GALLERY_IMAGES} photos maximum.`)
      return
    }

    form.delete('images')
    galleryImages.forEach((image) => form.append('images', image))

    setIsSaving(true)

    try {
      const createdPost = await api.createPostWithFiles(form, token)
      setMessage('Article publie.')
      event.currentTarget.reset()
      setIsComposerOpen(false)
      await loadPosts({ silent: true })
      await openPost(createdPost.id, false)
    } catch (error) {
      setMessage(toErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLike() {
    if (!selectedPost || !token) {
      setMessage('Connecte-toi pour aimer un article.')
      return
    }

    const alreadyLiked = likedPosts.includes(selectedPost.id)
    const previousPost = selectedPost

    setLikedPosts((current) =>
      alreadyLiked
        ? current.filter((id) => id !== selectedPost.id)
        : [...new Set([...current, selectedPost.id])]
    )
    setSelectedPost({
      ...selectedPost,
      likesCount: Math.max(0, selectedPost.likesCount + (alreadyLiked ? -1 : 1)),
    })

    try {
      const result = alreadyLiked
        ? await api.unlikePost(selectedPost.id, token)
        : await api.likePost(selectedPost.id, token)

      setSelectedPost((current) =>
        current && current.id === previousPost.id
          ? { ...current, likesCount: result.likesCount }
          : current
      )
      setMessage(result.liked ? 'Article ajoute aux favoris.' : 'Like retire.')
      await loadPosts({ silent: true })
    } catch (error) {
      setSelectedPost(previousPost)
      setLikedPosts((current) =>
        alreadyLiked
          ? [...new Set([...current, previousPost.id])]
          : current.filter((id) => id !== previousPost.id)
      )
      setMessage(toErrorMessage(error))
    }
  }

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPost || !token) {
      setMessage('Connecte-toi pour commenter.')
      return
    }

    const form = new FormData(event.currentTarget)
    const body = String(form.get('body') ?? '').trim()

    if (!body) {
      setMessage("Ecris un commentaire avant de l'envoyer.")
      return
    }

    setIsSaving(true)

    try {
      await api.createComment(selectedPost.id, body, token)
      event.currentTarget.reset()
      await openPost(selectedPost.id, false)
      await loadPosts({ silent: true })
      setMessage('Commentaire ajoute.')
    } catch (error) {
      setMessage(toErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main>
      <section className="topbar">
        <div>
          <p className="eyebrow">Adonis Blog</p>
          <h1>Publier, lire, reagir.</h1>
        </div>
        <div className="topbar-actions">
          <span className={`network ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
          <button onClick={() => setIsComposerOpen(true)} type="button">
            Nouvel article
          </button>
          <button className="ghost" onClick={() => loadPosts({ silent: true })}>
            {isRefreshing ? 'Synchro...' : 'Rafraichir'}
          </button>
        </div>
      </section>

      <section className="notice" aria-live="polite">
        <p>{message}</p>
        <small>
          {lastSync ? `Derniere synchro ${formatClockTime(lastSync)}` : 'Synchro en attente'}
        </small>
      </section>

      <section className="stats-strip">
        <strong>{posts.length}</strong>
        <span>articles</span>
        <strong>{stats.views}</strong>
        <span>vues</span>
        <strong>{stats.likes}</strong>
        <span>likes</span>
        <strong>{stats.comments}</strong>
        <span>commentaires</span>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <section className="surface">
            <div className="tabs">
              <button
                className={mode === 'login' ? 'active' : ''}
                onClick={() => setMode('login')}
                type="button"
              >
                Connexion
              </button>
              <button
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => setMode('signup')}
                type="button"
              >
                Inscription
              </button>
            </div>

            {auth ? (
              <div className="session">
                <span className="avatar">{auth.user.initials}</span>
                <div>
                  <strong>{auth.user.fullName ?? auth.user.email}</strong>
                  <span>{auth.user.email}</span>
                </div>
                <button className="ghost danger" onClick={handleLogout} type="button">
                  Se deconnecter
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth}>
                {mode === 'signup' && <input name="fullName" placeholder="Nom complet" />}
                <input name="email" type="email" placeholder="Email" required />
                <input name="password" type="password" placeholder="Mot de passe" required />
                {mode === 'signup' && (
                  <input
                    name="passwordConfirmation"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    required
                  />
                )}
                <button disabled={isSaving}>{mode === 'login' ? 'Entrer' : 'Creer le compte'}</button>
              </form>
            )}
          </section>

          <section className="surface publish-card">
            <div>
              <p className="eyebrow">Creation</p>
              <h2>Publier avec des fichiers</h2>
              <p>
                Les images de couverture et de galerie partent maintenant en fichiers uploades.
              </p>
            </div>
            <button disabled={!token} onClick={() => setIsComposerOpen(true)} type="button">
              {token ? 'Ouvrir la modale' : 'Connexion requise'}
            </button>
          </section>
        </aside>

        <section className="feed">
          <section className="post-list">
            <form className="search" onSubmit={handleSearch}>
              <input
                name="q"
                placeholder="Rechercher un article"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit">Chercher</button>
            </form>

            {isLoadingPosts ? (
              <div className="skeleton-list">
                <span />
                <span />
                <span />
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <button
                  className={`post-row ${selectedPost?.id === post.id ? 'selected' : ''}`}
                  key={post.id}
                  onClick={() =>
                    openPost(post.id).catch((error) => setMessage(toErrorMessage(error)))
                  }
                  type="button"
                >
                  <img
                    src={
                      resolveAssetUrl(post.coverImageUrl) ??
                      fallbackImages[post.id % fallbackImages.length]
                    }
                    alt={post.title}
                  />
                  <span>
                    <strong>{post.title}</strong>
                    <small>{formatRelativeTime(post.publishedAt ?? post.createdAt)}</small>
                    <small>
                      {post.likesCount} likes / {post.viewsCount} vues / {post.commentsCount} comm.
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <div className="empty compact">
                <h2>Aucun article.</h2>
                <p>Change la recherche ou publie le premier contenu.</p>
              </div>
            )}
          </section>

          <article className="reader">
            {selectedPost ? (
              <>
                <div className="cover-wrap">
                  <img className="cover" src={selectedImage} alt={selectedPost.title} />
                  <div>
                    <p className="eyebrow">
                      {selectedPost.author?.fullName ?? selectedPost.author?.email ?? 'Auteur'}
                    </p>
                    <h2>{selectedPost.title}</h2>
                    <p className="published-time">
                      Publie le {formatPublicationTime(selectedPost.publishedAt ?? selectedPost.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="reader-body">
                  <p className="excerpt">{selectedPost.excerpt ?? 'Sans resume pour le moment.'}</p>
                  <p className="body-copy">{selectedPost.body}</p>
                  <div className="metrics">
                    <span>{selectedPost.viewsCount} vues</span>
                    <span>{selectedPost.likesCount} likes</span>
                    <span>{selectedPost.comments?.length ?? 0} commentaires</span>
                  </div>
                  <button className="like-button" onClick={handleLike} type="button">
                    {likedPosts.includes(selectedPost.id) ? 'Retirer le like' : 'Aimer'}
                  </button>
                </div>

                {selectedPost.images.length > 0 && (
                  <div className="gallery">
                    {selectedPost.images.map((image) => (
                      <img
                        key={image.id}
                        src={resolveAssetUrl(image.url) ?? fallbackImages[0]}
                        alt={image.altText ?? selectedPost.title}
                      />
                    ))}
                  </div>
                )}

                <section className="comments">
                  <div>
                    <p className="eyebrow">Discussion</p>
                    <h3>Commentaires</h3>
                  </div>
                  <form onSubmit={handleComment}>
                    <input name="body" placeholder="Ajouter un commentaire" />
                    <button disabled={!token || isSaving}>Envoyer</button>
                  </form>
                  <div className="comment-list">
                    {selectedPost.comments?.length ? (
                      selectedPost.comments.map((comment) => (
                        <p key={comment.id}>
                          <strong>{comment.author?.fullName ?? comment.author?.email}</strong>
                          {comment.body}
                        </p>
                      ))
                    ) : (
                      <p className="muted">Aucun commentaire pour le moment.</p>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="empty">
                <img src={fallbackImages[2]} alt="Carnet ouvert" />
                <h2>Aucun article pour le moment.</h2>
              </div>
            )}
          </article>
        </section>
      </section>

      <ComposerModal
        canPublish={Boolean(token)}
        isSaving={isSaving}
        onClose={() => setIsComposerOpen(false)}
        onSubmit={handleCreatePost}
        open={isComposerOpen}
      />
    </main>
  )
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const details = formatErrorDetails(error.details)
    return details ? `${error.message} ${details}` : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Une erreur est survenue.'
}

function formatErrorDetails(details: unknown) {
  if (!details || typeof details !== 'object') {
    return ''
  }

  if (Array.isArray(details)) {
    return details
      .map((detail) => {
        if (detail && typeof detail === 'object' && 'message' in detail) {
          return String(detail.message)
        }

        return String(detail)
      })
      .join(' ')
  }

  return ''
}

createRoot(document.getElementById('root')!).render(<App />)
