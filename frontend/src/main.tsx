import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { api, ApiError } from './api'
import type { AuthPayload, CreatePostPayload, PostDto } from './types'
import './styles.css'

const fallbackImages = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
]

function readAuth() {
  const stored = localStorage.getItem('adonis_blog_auth')
  if (!stored) {
    return null
  }

  return JSON.parse(stored) as AuthPayload
}

function App() {
  const [auth, setAuth] = useState<AuthPayload | null>(() => readAuth())
  const [posts, setPosts] = useState<PostDto[]>([])
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null)
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('Pret pour publier.')
  const token = auth?.token

  const selectedImage = useMemo(() => {
    if (!selectedPost) {
      return fallbackImages[0]
    }

    return selectedPost.coverImageUrl ?? fallbackImages[selectedPost.id % fallbackImages.length]
  }, [selectedPost])

  async function loadPosts() {
    const freshPosts = await api.listPosts()
    setPosts(freshPosts)

    if (!selectedPost && freshPosts.length > 0) {
      await openPost(freshPosts[0].id, false)
    }
  }

  async function openPost(id: number, countView = true) {
    if (countView) {
      await api.recordView(id)
    }

    const post = await api.getPost(id)
    setSelectedPost(post)
  }

  useEffect(() => {
    loadPosts().catch((error) => setMessage(toErrorMessage(error)))
  }, [])

  function persistAuth(payload: AuthPayload | null) {
    setAuth(payload)

    if (payload) {
      localStorage.setItem('adonis_blog_auth', JSON.stringify(payload))
      setMessage(`Bienvenue ${payload.user.fullName ?? payload.user.email}.`)
      return
    }

    localStorage.removeItem('adonis_blog_auth')
    setMessage('Session terminee.')
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')

    try {
      const payload =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.signup({
              fullName: String(form.get('fullName') ?? ''),
              email,
              password,
              passwordConfirmation: String(form.get('passwordConfirmation') ?? ''),
            })

      persistAuth(payload)
    } catch (error) {
      setMessage(toErrorMessage(error))
    }
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setMessage('Connecte-toi pour publier.')
      return
    }

    const form = new FormData(event.currentTarget)
    const imageUrls = String(form.get('images') ?? '')
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean)

    const payload: CreatePostPayload = {
      title: String(form.get('title') ?? ''),
      excerpt: String(form.get('excerpt') ?? ''),
      coverImageUrl: String(form.get('coverImageUrl') ?? '') || null,
      body: String(form.get('body') ?? ''),
      isPublished: form.get('isPublished') === 'on',
      images: imageUrls.map((url, index) => ({
        url,
        altText: `Image ${index + 1}`,
        sortOrder: index,
      })),
    }

    try {
      const createdPost = await api.createPost(payload, token)
      setMessage('Article publie.')
      event.currentTarget.reset()
      await loadPosts()
      await openPost(createdPost.id, false)
    } catch (error) {
      setMessage(toErrorMessage(error))
    }
  }

  async function handleLike() {
    if (!selectedPost || !token) {
      setMessage('Connecte-toi pour aimer un article.')
      return
    }

    try {
      const alreadyLiked = likedPosts.includes(selectedPost.id)
      const result = alreadyLiked
        ? await api.unlikePost(selectedPost.id, token)
        : await api.likePost(selectedPost.id, token)

      setLikedPosts((current) =>
        result.liked
          ? [...new Set([...current, selectedPost.id])]
          : current.filter((id) => id !== selectedPost.id)
      )
      setSelectedPost({ ...selectedPost, likesCount: result.likesCount })
    } catch (error) {
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

    try {
      await api.createComment(selectedPost.id, String(form.get('body') ?? ''), token)
      event.currentTarget.reset()
      await openPost(selectedPost.id, false)
      setMessage('Commentaire ajoute.')
    } catch (error) {
      setMessage(toErrorMessage(error))
    }
  }

  return (
    <main>
      <section className="topbar">
        <div>
          <p className="eyebrow">Adonis Blog</p>
          <h1>Articles, images, reactions.</h1>
        </div>
        <p className="status">{message}</p>
      </section>

      <section className="workspace">
        <aside className="panel auth-panel">
          <div className="tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Connexion
            </button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
              Inscription
            </button>
          </div>

          {auth ? (
            <div className="session">
              <strong>{auth.user.fullName ?? auth.user.email}</strong>
              <span>{auth.user.email}</span>
              <button onClick={() => persistAuth(null)}>Se deconnecter</button>
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
              <button>{mode === 'login' ? 'Entrer' : 'Creer le compte'}</button>
            </form>
          )}

          <form className="composer" onSubmit={handleCreatePost}>
            <h2>Nouvel article</h2>
            <input name="title" placeholder="Titre" required />
            <input name="excerpt" placeholder="Resume court" />
            <input name="coverImageUrl" placeholder="Image de couverture URL" />
            <textarea name="images" placeholder="Images galerie, une URL par ligne" rows={3} />
            <textarea name="body" placeholder="Contenu" rows={7} required />
            <label className="checkbox">
              <input name="isPublished" type="checkbox" defaultChecked />
              Publier
            </label>
            <button>Publier</button>
          </form>
        </aside>

        <section className="feed">
          <div className="post-list">
            {posts.map((post) => (
              <button
                className={`post-row ${selectedPost?.id === post.id ? 'selected' : ''}`}
                key={post.id}
                onClick={() =>
                  openPost(post.id).catch((error) => setMessage(toErrorMessage(error)))
                }
              >
                <img
                  src={post.coverImageUrl ?? fallbackImages[post.id % fallbackImages.length]}
                  alt={post.title}
                />
                <span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.likesCount} likes · {post.viewsCount} vues · {post.commentsCount} comm.
                  </small>
                </span>
              </button>
            ))}
          </div>

          <article className="reader">
            {selectedPost ? (
              <>
                <img className="cover" src={selectedImage} alt={selectedPost.title} />
                <div className="reader-body">
                  <p className="eyebrow">
                    {selectedPost.author?.fullName ?? selectedPost.author?.email}
                  </p>
                  <h2>{selectedPost.title}</h2>
                  <p className="excerpt">{selectedPost.excerpt}</p>
                  <p>{selectedPost.body}</p>
                  <div className="metrics">
                    <span>{selectedPost.viewsCount} vues</span>
                    <span>{selectedPost.likesCount} likes</span>
                    <span>{selectedPost.comments?.length ?? 0} commentaires</span>
                  </div>
                  <button onClick={handleLike}>
                    {likedPosts.includes(selectedPost.id) ? 'Retirer le like' : 'Aimer'}
                  </button>
                </div>

                {selectedPost.images.length > 0 && (
                  <div className="gallery">
                    {selectedPost.images.map((image) => (
                      <img
                        key={image.id}
                        src={image.url}
                        alt={image.altText ?? selectedPost.title}
                      />
                    ))}
                  </div>
                )}

                <section className="comments">
                  <h3>Commentaires</h3>
                  <form onSubmit={handleComment}>
                    <input name="body" placeholder="Ajouter un commentaire" />
                    <button>Envoyer</button>
                  </form>
                  {selectedPost.comments?.map((comment) => (
                    <p key={comment.id}>
                      <strong>{comment.author?.fullName ?? comment.author?.email}</strong>
                      {comment.body}
                    </p>
                  ))}
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
    </main>
  )
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return `${error.code}: ${error.message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Une erreur est survenue.'
}

createRoot(document.getElementById('root')!).render(<App />)
