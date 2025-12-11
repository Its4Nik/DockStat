type Constructor<T = unknown> = new (...args: unknown[]) => T

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

export function applyMixins<Base extends Constructor, Mixins extends readonly Constructor[]>(
  BaseClass: Base,
  ...mixins: Mixins
): Constructor<InstanceType<Base> & UnionToIntersection<InstanceType<Mixins[number]>>> & Base {
  mixins.forEach((mixin) => {
    Object.getOwnPropertyNames(mixin.prototype).forEach((name) => {
      if (name !== "constructor") {
        const descriptor = Object.getOwnPropertyDescriptor(mixin.prototype, name)
        if (descriptor) {
          Object.defineProperty(BaseClass.prototype, name, descriptor)
        }
      }
    })

    // Copy static properties
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
    InstanceType<Base> & UnionToIntersection<InstanceType<Mixins[number]>>
  > &
    Base
}
