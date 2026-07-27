export * from "./EdenContext"
export * from "./EdenProvider"
export * from "./types"
export * from "./useEdenClient"
export * from "./useEdenMutation"
export * from "./useEdenQuery"
export * from "./useEdenRouteMutation"

import type {
  EdenBody,
  EdenFetchOptions,
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
  private onUnauthorized?: () => void

  constructor(toaster: ToasterFunction) {
    this.bearerToken = localStorage.getItem("auth_token") ?? ""
    this.toaster = toaster
  }

  setToken(token: string) {
    this.bearerToken = token
  }

  setOnUnauthorized(cb: (() => void) | undefined) {
    this.onUnauthorized = cb
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
      onUnauthorized: this.onUnauthorized,
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

  /**
   * Imperative one-off call for use outside of React hooks (e.g. inside
   * event handlers or useCallback bodies that can't use useQuery/useMutation).
   *
   * Automatically injects the bearer token and triggers `onUnauthorized`
   * when the response is a 401, unless `skipAuthHandler` is set.
   *
   * Pass `body` for POST/PATCH/PUT routes.
   */
  async call(
    // biome-ignore lint/suspicious/noExplicitAny: Eden treaty route functions have complex proxy types that can't be expressed statically
    route: (...args: any[]) => Promise<any>,
    opts?: {
      body?: unknown
      fetchOptions?: EdenFetchOptions
      skipAuthHandler?: boolean
    }
  ): Promise<{
    data: unknown
    error: unknown
    status: number
  }> {
    const headers: Record<string, unknown> = {
      authorization: `Bearer ${this.bearerToken}`,
      ...opts?.fetchOptions?.headers,
    }

    let result: { data: unknown; error: unknown; status: number }

    if (opts?.body !== undefined) {
      result = await route(opts.body, {
        ...opts.fetchOptions,
        headers,
      })
    } else {
      result = await route({
        ...opts?.fetchOptions,
        headers,
      })
    }

    if (!opts?.skipAuthHandler && result.status === 401 && this.onUnauthorized) {
      this.onUnauthorized()
    }

    return result
  }
}
