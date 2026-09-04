import { useEffect, useRef, useState } from 'react'

/** localStorage から読む(壊れていれば undefined) */
export function readStored<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

/** localStorage に永続化する useState。key が変わると読み直す */
export function useStoredState<T>(
  key: string,
  initial: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStored<T>(key) ?? initial)
  const loadedKey = useRef(key)

  useEffect(() => {
    if (loadedKey.current !== key) {
      loadedKey.current = key
      setValue(readStored<T>(key) ?? initial)
    }
    // initial は再読込時のフォールバックのみに使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (loadedKey.current !== key) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // プライベートモード等では保存できなくてもアプリは動かす
    }
  }, [key, value])

  return [value, setValue]
}
