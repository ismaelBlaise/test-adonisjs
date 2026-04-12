type ApiMeta = Record<string, unknown>

export function ok<T>(data: T, meta?: ApiMeta) {
  return {
    data,
    ...(meta ? { meta } : {}),
  }
}

export function message(messageText: string) {
  return ok({ message: messageText })
}

export function paginated<T>(data: T[], pagination: ApiMeta) {
  return ok(data, { pagination })
}
