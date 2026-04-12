/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessToken: {
      store: typeof routes['auth.access_token.store']
      destroy: typeof routes['auth.access_token.destroy']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
  }
  posts: {
    index: typeof routes['posts.index']
    show: typeof routes['posts.show']
    comments: {
      index: typeof routes['posts.comments.index']
      store: typeof routes['posts.comments.store']
    }
    views: {
      store: typeof routes['posts.views.store']
    }
    store: typeof routes['posts.store']
    update: typeof routes['posts.update']
    destroy: typeof routes['posts.destroy']
    likes: {
      store: typeof routes['posts.likes.store']
      destroy: typeof routes['posts.likes.destroy']
    }
  }
  comments: {
    update: typeof routes['comments.update']
    destroy: typeof routes['comments.destroy']
  }
}
