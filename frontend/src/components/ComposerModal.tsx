import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

const MAX_GALLERY_IMAGES = 12

type FilePreview = {
  name: string
  url: string
}

type ComposerModalProps = {
  open: boolean
  canPublish: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ComposerModal({
  open,
  canPublish,
  isSaving,
  onClose,
  onSubmit,
}: ComposerModalProps) {
  const [coverPreview, setCoverPreview] = useState<FilePreview | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<FilePreview[]>([])

  useEffect(() => {
    if (!open) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview.url)
      }
    }
  }, [coverPreview])

  useEffect(() => {
    return () => {
      galleryPreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [galleryPreviews])

  useEffect(() => {
    if (!open) {
      setCoverPreview(null)
      setGalleryPreviews([])
    }
  }, [open])

  if (!open) {
    return null
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setCoverPreview(file ? toPreview(file) : null)
  }

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_GALLERY_IMAGES)
    setGalleryPreviews(files.map(toPreview))
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        aria-modal="true"
        role="dialog"
        aria-labelledby="composer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Composer</p>
            <h2 id="composer-title">Nouvel article</h2>
          </div>
          <button className="ghost icon-button" onClick={onClose} type="button">
            Fermer
          </button>
        </div>

        <form className="composer-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              Titre
              <input name="title" placeholder="Titre de l'article" required />
            </label>
            <label>
              Image de couverture
              <input name="coverImage" type="file" accept="image/*" onChange={handleCoverChange} />
            </label>
          </div>

          {coverPreview && (
            <div className="upload-preview cover-preview">
              <img src={coverPreview.url} alt={coverPreview.name} />
              <span>{coverPreview.name}</span>
            </div>
          )}

          <label>
            Resume court
            <input name="excerpt" placeholder="Une phrase pour donner envie de lire" />
          </label>

          <label>
            Galerie
            <input name="images" type="file" accept="image/*" multiple onChange={handleGalleryChange} />
            <span className="field-hint">
              {galleryPreviews.length > 0
                ? `${galleryPreviews.length} photo(s) selectionnee(s)`
                : `Jusqu'a ${MAX_GALLERY_IMAGES} photos`}
            </span>
          </label>

          {galleryPreviews.length > 0 && (
            <div className="upload-preview gallery-preview">
              {galleryPreviews.map((preview) => (
                <figure key={preview.url}>
                  <img src={preview.url} alt={preview.name} />
                  <figcaption>{preview.name}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <label>
            Contenu
            <textarea name="body" placeholder="Ecris ton article ici" rows={8} required />
          </label>

          <label className="checkbox">
            <input name="isPublished" type="checkbox" defaultChecked />
            Publier maintenant
          </label>

          <div className="modal-actions">
            <button className="ghost" onClick={onClose} type="button">
              Annuler
            </button>
            <button disabled={!canPublish || isSaving} type="submit">
              {canPublish ? 'Publier' : 'Connexion requise'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function toPreview(file: File): FilePreview {
  return {
    name: file.name,
    url: URL.createObjectURL(file),
  }
}
