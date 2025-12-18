type Constructor<T, A extends unknown[] = unknown[]> = new (...args: A) => T

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

export function applyMixins<
  // biome-ignore lint/suspicious/noExplicitAny: unknown breaks it
  Base extends Constructor<any, any[]>,
  // biome-ignore lint/suspicious/noExplicitAny: unknown breaks it
  Mixins extends readonly Constructor<any, any[]>[],
>(
  BaseClass: Base,
  ...mixins: Mixins
): Constructor<
  InstanceType<Base> & UnionToIntersection<InstanceType<Mixins[number]>>,
  ConstructorParameters<Base>
> &
  Base {
  mixins.forEach((mixin) => {
    Object.getOwnPropertyNames(mixin.prototype).forEach((name) => {
      if (name !== "constructor") {
        const descriptor = Object.getOwnPropertyDescriptor(mixin.prototype, name)
        if (descriptor) {
          Object.defineProperty(BaseClass.prototype, name, descriptor)
        }
      }
    })

    Object.getOwnPropertyNames(mixin).forEach((name) => {
      if (name !== "prototype" && name !== "length" && name !== "name") {
        const descriptor = Object.getOwnPropertyDescriptor(mixin, name)
        if (descriptor) {
          Object.defineProperty(BaseClass, name, descriptor)
        }
      }
    })
  })

  return BaseClass as Constructor<
    InstanceType<Base> & UnionToIntersection<InstanceType<Mixins[number]>>,
    ConstructorParameters<Base>
  > &
    Base
}
