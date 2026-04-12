import type User from '#models/user'

export type UserDto = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string | null
  updatedAt: string | null
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    initials: user.initials,
    createdAt: user.createdAt?.toISO() ?? null,
    updatedAt: user.updatedAt?.toISO() ?? null,
  }
}
