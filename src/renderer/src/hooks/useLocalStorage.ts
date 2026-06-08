import { useState, useCallback } from 'react'

export function useLocalStorage<T extends string>(
  key: string,
  defaultValue: T,
  validate?: (value: string) => value is T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    if (saved !== null && validate) return validate(saved) ? saved : defaultValue
    return (saved as T) ?? defaultValue
  })

  const setValue = useCallback(
    (value: T) => {
      setState(value)
      localStorage.setItem(key, value)
    },
    [key]
  )

  return [state, setValue]
}
