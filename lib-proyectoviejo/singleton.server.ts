export function singleton<Value>(name: string, valueFactory: () => Value): Value {
  const g = globalThis as any
  g.__singletons ??= {}
  g.__singletons[name] ??= valueFactory()
  return g.__singletons[name]
}