const LOCAL_IMAGE_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export function normalizeTerrainImageUrl(imageUrl) {
  if (typeof imageUrl !== 'string') return null

  const trimmed = imageUrl.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)

      if (LOCAL_IMAGE_HOSTS.has(parsed.hostname) && parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname
      }

      return trimmed
    } catch {
      return trimmed
    }
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed
  }

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`
  }

  return trimmed
}
