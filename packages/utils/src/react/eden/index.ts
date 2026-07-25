export * from "./EdenContext"
export * from "./EdenProvider"
export * from "./types"
export * from "./useEdenClient"
export * from "./useEdenMutation"
export * from "./useEdenQuery"
export * from "./useEdenRouteMutation"

import type {
  EdenBody,
  EdenQueryRoute,
  EdenRoute,
  MutationInput,
  MutationResult,
  ResponseData,
  ToastConfig,
  ToasterFunction,
} from "./types"
import { useEdenMutation } from "./useEdenMutation"
import { useEdenQuery } from "./useEdenQuery"
import { useEdenRouteMutation } from "./useEdenRouteMutation"

type WrapToast<T> = T extends { toast?: infer TToast }
  ? Omit<T, "toast"> & { toast?: { toaster: ToasterFunction; toasts: TToast } }
  : T

export class Client {
  private bearerToken: string
  private toaster: ToasterFunction

  constructor(toaster: ToasterFunction) {
    this.bearerToken = localStorage.getItem("auth_token") ?? ""
    this.toaster = toaster
  }

  setToken(token: string) {
    this.bearerToken = token
  }

  private buildCtx<
    T extends {
      opts?: { headers?: Record<string, unknown> }
      // biome-ignore lint/suspicious/noExplicitAny: Im way too tired for ts
      toast?: any
    },
  >(ctx: T): WrapToast<T> {
    const authorization = `Bearer ${this.bearerToken}`
    return {
      ...ctx,
      opts: {
        headers: {
          ...ctx.opts?.headers,
          authorization,
        },
      },
      toast: ctx.toast
        ? {
            toaster: this.toaster,
            toasts: ctx.toast,
          }
        : undefined,
    } as unknown as WrapToast<T>
  }

  query<TRoute extends EdenQueryRoute>(
    ctx: Omit<Parameters<typeof useEdenQuery<TRoute>>[0], "toast">
  ) {
    return useEdenQuery<TRoute>(this.buildCtx(ctx))
  }

  mutate<TRoute extends EdenRoute>(
    ctx: Omit<Parameters<typeof useEdenMutation<TRoute>>[0], "toast"> & {
      toast: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
    }
  ) {
    return useEdenMutation<TRoute>(this.buildCtx(ctx))
  }

  mutateRoute<TParams extends Record<string, unknown>, TRoute extends EdenRoute>(
    ctx: Omit<Parameters<typeof useEdenRouteMutation<TParams, TRoute>>[0], "toast"> & {
      toast: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
    }
  ) {
    return useEdenRouteMutation<TParams, TRoute>(this.buildCtx(ctx))
  }

  /**
   * Prepare a query hook factory. Returns a custom hook that, when called
   * inside a component, will invoke `useEdenQuery` with the given config
   * and the latest bearer token.
   */
  prepareQuery<TRoute extends EdenQueryRoute>(
    ctx: Omit<Parameters<typeof useEdenQuery<TRoute>>[0], "toast">
  ): () => ReturnType<typeof useEdenQuery<TRoute>> {
    return () => useEdenQuery<TRoute>(this.buildCtx(ctx))
  }

  /**
   * Prepare a route-mutation hook factory. Returns a custom hook that, when
   * called inside a component, will invoke `useEdenRouteMutation` with the
   * given config and the latest bearer token.
   */
  prepareMutateRoute<TParams extends Record<string, unknown>, TRoute extends EdenRoute>(
    ctx: Omit<Parameters<typeof useEdenRouteMutation<TParams, TRoute>>[0], "toast"> & {
      toast?: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
    }
  ): () => MutationResult<ResponseData<TRoute>, MutationInput<TParams, TRoute>> {
    return () => useEdenRouteMutation<TParams, TRoute>(this.buildCtx(ctx))
  }
}
