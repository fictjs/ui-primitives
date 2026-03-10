const __instantiated = new WeakMap<OrderedDict<unknown, unknown>, boolean>()

class OrderedDict<K, V> extends Map<K, V> {
  #keys: K[]

  constructor(iterable?: Iterable<readonly [K, V]> | null)
  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries)
    this.#keys = [...super.keys()]
    __instantiated.set(this, true)
  }

  override set(key: K, value: V) {
    if (__instantiated.get(this)) {
      if (this.has(key)) {
        this.#keys[this.#keys.indexOf(key)] = key
      } else {
        this.#keys.push(key)
      }
    }

    super.set(key, value)
    return this
  }

  insert(index: number, key: K, value: V) {
    const has = this.has(key)
    const length = this.#keys.length
    const relativeIndex = toSafeInteger(index)
    let actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex
    const safeIndex = actualIndex < 0 || actualIndex >= length ? -1 : actualIndex

    if (safeIndex === this.size || (has && safeIndex === this.size - 1) || safeIndex === -1) {
      this.set(key, value)
      return this
    }

    const size = this.size + (has ? 0 : 1)

    if (relativeIndex < 0) {
      actualIndex++
    }

    const keys = [...this.#keys]
    let nextValue: V | undefined
    let shouldSkip = false

    for (let currentIndex = actualIndex; currentIndex < size; currentIndex++) {
      if (actualIndex === currentIndex) {
        let nextKey = keys[currentIndex]!

        if (keys[currentIndex] === key) {
          nextKey = keys[currentIndex + 1]!
        }

        if (has) {
          this.delete(key)
        }

        nextValue = this.get(nextKey)
        this.set(key, value)
      } else {
        if (!shouldSkip && keys[currentIndex - 1] === key) {
          shouldSkip = true
        }

        const currentKey = keys[shouldSkip ? currentIndex : currentIndex - 1]!
        const currentValue = nextValue!
        nextValue = this.get(currentKey)
        this.delete(currentKey)
        this.set(currentKey, currentValue)
      }
    }

    return this
  }

  with(index: number, key: K, value: V) {
    const copy = new OrderedDict(this)
    copy.insert(index, key, value)
    return copy
  }

  before(key: K) {
    const index = this.#keys.indexOf(key) - 1
    if (index < 0) {
      return undefined
    }

    return this.entryAt(index)
  }

  setBefore(key: K, newKey: K, value: V) {
    const index = this.#keys.indexOf(key)
    if (index === -1) {
      return this
    }

    return this.insert(index, newKey, value)
  }

  after(key: K) {
    let index = this.#keys.indexOf(key)
    index = index === -1 || index === this.size - 1 ? -1 : index + 1

    if (index === -1) {
      return undefined
    }

    return this.entryAt(index)
  }

  setAfter(key: K, newKey: K, value: V) {
    const index = this.#keys.indexOf(key)
    if (index === -1) {
      return this
    }

    return this.insert(index + 1, newKey, value)
  }

  first() {
    return this.entryAt(0)
  }

  last() {
    return this.entryAt(-1)
  }

  override clear() {
    this.#keys = []
    return super.clear()
  }

  override delete(key: K) {
    const deleted = super.delete(key)

    if (deleted) {
      this.#keys.splice(this.#keys.indexOf(key), 1)
    }

    return deleted
  }

  deleteAt(index: number) {
    const key = this.keyAt(index)
    if (key !== undefined) {
      return this.delete(key)
    }

    return false
  }

  at(index: number) {
    const key = at(this.#keys, index)
    if (key !== undefined) {
      return this.get(key)
    }
  }

  entryAt(index: number): [K, V] | undefined {
    const key = at(this.#keys, index)
    if (key !== undefined) {
      return [key, this.get(key)!]
    }
  }

  indexOf(key: K) {
    return this.#keys.indexOf(key)
  }

  keyAt(index: number) {
    return at(this.#keys, index)
  }

  from(key: K, offset: number) {
    const index = this.indexOf(key)
    if (index === -1) {
      return undefined
    }

    let destination = index + offset
    if (destination < 0) destination = 0
    if (destination >= this.size) destination = this.size - 1
    return this.at(destination)
  }

  keyFrom(key: K, offset: number) {
    const index = this.indexOf(key)
    if (index === -1) {
      return undefined
    }

    let destination = index + offset
    if (destination < 0) destination = 0
    if (destination >= this.size) destination = this.size - 1
    return this.keyAt(destination)
  }

  find(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => boolean,
    thisArg?: unknown,
  ) {
    let index = 0

    for (const entry of this) {
      if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
        return entry
      }

      index++
    }

    return undefined
  }

  findIndex(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => boolean,
    thisArg?: unknown,
  ) {
    let index = 0

    for (const entry of this) {
      if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
        return index
      }

      index++
    }

    return -1
  }

  filter<KK extends K, VV extends V>(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => entry is [KK, VV],
    thisArg?: unknown,
  ): OrderedDict<KK, VV>

  filter(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => unknown,
    thisArg?: unknown,
  ): OrderedDict<K, V>

  filter(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => unknown,
    thisArg?: unknown,
  ) {
    const entries: Array<[K, V]> = []
    let index = 0

    for (const entry of this) {
      if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
        entries.push(entry)
      }

      index++
    }

    return new OrderedDict(entries)
  }

  map<U>(
    callbackfn: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => U,
    thisArg?: unknown,
  ): OrderedDict<K, U> {
    const entries: [K, U][] = []
    let index = 0

    for (const entry of this) {
      entries.push([entry[0], Reflect.apply(callbackfn, thisArg, [entry, index, this])])
      index++
    }

    return new OrderedDict(entries)
  }

  reduce(
    callbackfn: (
      previousValue: [K, V],
      currentEntry: [K, V],
      currentIndex: number,
      dictionary: OrderedDict<K, V>,
    ) => [K, V],
  ): [K, V]
  reduce(
    callbackfn: (
      previousValue: [K, V],
      currentEntry: [K, V],
      currentIndex: number,
      dictionary: OrderedDict<K, V>,
    ) => [K, V],
    initialValue: [K, V],
  ): [K, V]
  reduce<U>(
    callbackfn: (
      previousValue: U,
      currentEntry: [K, V],
      currentIndex: number,
      dictionary: OrderedDict<K, V>,
    ) => U,
    initialValue: U,
  ): U

  reduce<U>(
    ...args: [
      (
        previousValue: U,
        currentEntry: [K, V],
        currentIndex: number,
        dictionary: OrderedDict<K, V>,
      ) => U,
      U?,
    ]
  ) {
    const [callbackfn, initialValue] = args
    let index = 0
    let accumulator = initialValue ?? (this.at(0)! as U)

    for (const entry of this) {
      if (index === 0 && args.length === 1) {
        accumulator = entry as unknown as U
      } else {
        accumulator = Reflect.apply(callbackfn, this, [accumulator, entry, index, this])
      }

      index++
    }

    return accumulator
  }

  reduceRight(
    callbackfn: (
      previousValue: [K, V],
      currentEntry: [K, V],
      currentIndex: number,
      dictionary: OrderedDict<K, V>,
    ) => [K, V],
  ): [K, V]
  reduceRight(
    callbackfn: (
      previousValue: [K, V],
      currentEntry: [K, V],
      currentIndex: number,
      dictionary: OrderedDict<K, V>,
    ) => [K, V],
    initialValue: [K, V],
  ): [K, V]
  reduceRight<U>(
    callbackfn: (
      previousValue: U,
      currentEntry: [K, V],
      currentIndex: number,
      dictionary: OrderedDict<K, V>,
    ) => U,
    initialValue: U,
  ): U

  reduceRight<U>(
    ...args: [
      (
        previousValue: U,
        currentEntry: [K, V],
        currentIndex: number,
        dictionary: OrderedDict<K, V>,
      ) => U,
      U?,
    ]
  ) {
    const [callbackfn, initialValue] = args
    let accumulator = initialValue ?? (this.at(-1)! as U)

    for (let index = this.size - 1; index >= 0; index--) {
      const entry = this.entryAt(index)!

      if (index === this.size - 1 && args.length === 1) {
        accumulator = entry as unknown as U
      } else {
        accumulator = Reflect.apply(callbackfn, this, [accumulator, entry, index, this])
      }
    }

    return accumulator
  }

  toSorted(compareFn?: (a: [K, V], b: [K, V]) => number): OrderedDict<K, V> {
    return new OrderedDict([...this.entries()].sort(compareFn))
  }

  toReversed(): OrderedDict<K, V> {
    const reversed = new OrderedDict<K, V>()

    for (let index = this.size - 1; index >= 0; index--) {
      const key = this.keyAt(index)!
      const value = this.get(key)!
      reversed.set(key, value)
    }

    return reversed
  }

  toSpliced(start: number, deleteCount?: number): OrderedDict<K, V>
  toSpliced(start: number, deleteCount: number, ...items: [K, V][]): OrderedDict<K, V>
  toSpliced(...args: [start: number, deleteCount: number, ...items: [K, V][]]) {
    const entries = [...this.entries()]
    entries.splice(...args)
    return new OrderedDict(entries)
  }

  slice(start?: number, end?: number) {
    const result = new OrderedDict<K, V>()
    let stop = this.size - 1

    if (start === undefined) {
      return result
    }

    let safeStart = start
    if (safeStart < 0) {
      safeStart += this.size
    }

    if (end !== undefined && end > 0) {
      stop = end - 1
    }

    for (let index = safeStart; index <= stop; index++) {
      const key = this.keyAt(index)!
      const value = this.get(key)!
      result.set(key, value)
    }

    return result
  }

  every(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => unknown,
    thisArg?: unknown,
  ) {
    let index = 0

    for (const entry of this) {
      if (!Reflect.apply(predicate, thisArg, [entry, index, this])) {
        return false
      }

      index++
    }

    return true
  }

  some(
    predicate: (entry: [K, V], index: number, dictionary: OrderedDict<K, V>) => unknown,
    thisArg?: unknown,
  ) {
    let index = 0

    for (const entry of this) {
      if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
        return true
      }

      index++
    }

    return false
  }
}

type KeyOf<D extends OrderedDict<unknown, unknown>> =
  D extends OrderedDict<infer K, unknown> ? K : never
type ValueOf<D extends OrderedDict<unknown, unknown>> =
  D extends OrderedDict<unknown, infer V> ? V : never
type EntryOf<D extends OrderedDict<unknown, unknown>> = [KeyOf<D>, ValueOf<D>]

function at<T>(array: ArrayLike<T>, index: number): T | undefined {
  if ('at' in Array.prototype) {
    return Array.prototype.at.call(array, index) as T | undefined
  }

  const actualIndex = toSafeIndex(array, index)
  return actualIndex === -1 ? undefined : array[actualIndex]
}

function toSafeIndex(array: ArrayLike<unknown>, index: number) {
  const length = array.length
  const relativeIndex = toSafeInteger(index)
  const actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex
  return actualIndex < 0 || actualIndex >= length ? -1 : actualIndex
}

function toSafeInteger(value: number) {
  return Number.isNaN(value) || value === 0 ? 0 : Math.trunc(value)
}

export { OrderedDict }
export type { EntryOf, KeyOf, ValueOf }
