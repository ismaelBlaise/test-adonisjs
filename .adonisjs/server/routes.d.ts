import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.destroy': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.comments.index': { paramsTuple: [ParamValue]; params: {'post_id': ParamValue} }
    'posts.views.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.likes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.likes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.comments.store': { paramsTuple: [ParamValue]; params: {'post_id': ParamValue} }
    'comments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.comments.index': { paramsTuple: [ParamValue]; params: {'post_id': ParamValue} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.comments.index': { paramsTuple: [ParamValue]; params: {'post_id': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.destroy': { paramsTuple?: []; params?: {} }
    'posts.views.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.likes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.comments.store': { paramsTuple: [ParamValue]; params: {'post_id': ParamValue} }
  }
  PATCH: {
    'posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.likes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'comments.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}