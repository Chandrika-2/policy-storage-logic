"use client"

import { StateStorage } from "zustand/middleware"

const DB_NAME = "seccomply-db"
const DB_VERSION = 1
const STORE_NAME = "app-state"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(name)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          resolve(request.result ?? null)
        }
      })
    } catch (error) {
      console.error("IndexedDB getItem error:", error)
      return null
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(value, name)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error("IndexedDB setItem error:", error)
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(name)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error("IndexedDB removeItem error:", error)
    }
  },
}
