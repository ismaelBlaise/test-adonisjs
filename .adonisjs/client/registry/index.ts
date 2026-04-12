/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_token.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_token.store']['types'],
  },
  'auth.access_token.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/auth/logout',
    tokens: [{"old":"/api/v1/auth/logout","type":0,"val":"api","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.access_token.destroy']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'posts.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/posts',
    tokens: [{"old":"/api/v1/posts","type":0,"val":"api","end":""},{"old":"/api/v1/posts","type":0,"val":"v1","end":""},{"old":"/api/v1/posts","type":0,"val":"posts","end":""}],
    types: placeholder as Registry['posts.index']['types'],
  },
  'posts.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/posts/:id',
    tokens: [{"old":"/api/v1/posts/:id","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:id","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['posts.show']['types'],
  },
  'posts.comments.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/posts/:post_id/comments',
    tokens: [{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:post_id/comments","type":1,"val":"post_id","end":""},{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"comments","end":""}],
    types: placeholder as Registry['posts.comments.index']['types'],
  },
  'posts.views.store': {
    methods: ["POST"],
    pattern: '/api/v1/posts/:id/views',
    tokens: [{"old":"/api/v1/posts/:id/views","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:id/views","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:id/views","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:id/views","type":1,"val":"id","end":""},{"old":"/api/v1/posts/:id/views","type":0,"val":"views","end":""}],
    types: placeholder as Registry['posts.views.store']['types'],
  },
  'posts.store': {
    methods: ["POST"],
    pattern: '/api/v1/posts',
    tokens: [{"old":"/api/v1/posts","type":0,"val":"api","end":""},{"old":"/api/v1/posts","type":0,"val":"v1","end":""},{"old":"/api/v1/posts","type":0,"val":"posts","end":""}],
    types: placeholder as Registry['posts.store']['types'],
  },
  'posts.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/posts/:id',
    tokens: [{"old":"/api/v1/posts/:id","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:id","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['posts.update']['types'],
  },
  'posts.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/posts/:id',
    tokens: [{"old":"/api/v1/posts/:id","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:id","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['posts.destroy']['types'],
  },
  'posts.likes.store': {
    methods: ["POST"],
    pattern: '/api/v1/posts/:id/likes',
    tokens: [{"old":"/api/v1/posts/:id/likes","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:id/likes","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:id/likes","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:id/likes","type":1,"val":"id","end":""},{"old":"/api/v1/posts/:id/likes","type":0,"val":"likes","end":""}],
    types: placeholder as Registry['posts.likes.store']['types'],
  },
  'posts.likes.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/posts/:id/likes',
    tokens: [{"old":"/api/v1/posts/:id/likes","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:id/likes","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:id/likes","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:id/likes","type":1,"val":"id","end":""},{"old":"/api/v1/posts/:id/likes","type":0,"val":"likes","end":""}],
    types: placeholder as Registry['posts.likes.destroy']['types'],
  },
  'posts.comments.store': {
    methods: ["POST"],
    pattern: '/api/v1/posts/:post_id/comments',
    tokens: [{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"api","end":""},{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"v1","end":""},{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"posts","end":""},{"old":"/api/v1/posts/:post_id/comments","type":1,"val":"post_id","end":""},{"old":"/api/v1/posts/:post_id/comments","type":0,"val":"comments","end":""}],
    types: placeholder as Registry['posts.comments.store']['types'],
  },
  'comments.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/comments/:id',
    tokens: [{"old":"/api/v1/comments/:id","type":0,"val":"api","end":""},{"old":"/api/v1/comments/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/comments/:id","type":0,"val":"comments","end":""},{"old":"/api/v1/comments/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['comments.update']['types'],
  },
  'comments.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/comments/:id',
    tokens: [{"old":"/api/v1/comments/:id","type":0,"val":"api","end":""},{"old":"/api/v1/comments/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/comments/:id","type":0,"val":"comments","end":""},{"old":"/api/v1/comments/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['comments.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
