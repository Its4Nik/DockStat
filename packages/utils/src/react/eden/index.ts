export * from "./types"
export * from "./useEdenMutation"
export * from "./useEdenQuery"
export * from "./useEdenRouteMutation"

import type { NestedOmit } from "../../type"
import type {
  EdenBody,
  EdenQueryRoute,
  EdenRoute,
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
      toast?: any
    },
  >(ctx: T): WrapToast<T> {
    const authorization = "Bearer " + this.bearerToken
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
    return useEdenQuery(this.buildCtx(ctx))
  }

  mutate<TRoute extends EdenRoute>(
    ctx: Omit<Parameters<typeof useEdenMutation<TRoute>>[0], "toast"> & {
      toast: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
    }
  ) {
    return useEdenMutation(this.buildCtx(ctx))
  }

  mutateRoute<TParams extends Record<string, unknown>, TRoute extends EdenRoute>(
    ctx: Omit<Parameters<typeof useEdenRouteMutation<TParams, TRoute>>[0], "toast"> & {
      toast: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
    }
  ) {
    return useEdenRouteMutation(this.buildCtx(ctx))
  }
}
