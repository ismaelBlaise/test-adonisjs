export function formatClockTime(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function formatPublicationTime(value: string | null) {
  if (!value) {
    return 'Publication en attente'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return 'Brouillon'
  }

  const date = new Date(value)
  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absDiff = Math.abs(diffInSeconds)
  const formatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

  if (absDiff < 60) {
    return formatter.format(diffInSeconds, 'second')
  }

  if (absDiff < 3600) {
    return formatter.format(Math.round(diffInSeconds / 60), 'minute')
  }

  if (absDiff < 86400) {
    return formatter.format(Math.round(diffInSeconds / 3600), 'hour')
  }

  return formatter.format(Math.round(diffInSeconds / 86400), 'day')
}
