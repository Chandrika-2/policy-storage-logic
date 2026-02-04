import { create } from "zustand"
import { persist } from "zustand/middleware"
import { indexedDBStorage } from "./indexeddb-storage"
import { createJSONStorage } from "zustand/middleware"

export interface PolicyFile {
  id: string
  name: string
  fileName: string
  fileContent: string // base64 encoded file content
  uploadedAt: string
}

export interface Client {
  id: string
  companyName: string
  logo: string | null
  headerText: string
  footerLeftText: string
  footerCenterText: string
  footerRightText: string
  selectedPolicies: string[]
  createdAt: string
}

interface AppState {
  policyFiles: PolicyFile[]
  clients: Client[]
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  addPolicyFile: (name: string, fileName: string, fileContent: string) => void
  addPolicyFiles: (files: Array<{ name: string; fileName: string; fileContent: string }>) => void
  removePolicyFile: (id: string) => void
  clearAllPolicyFiles: () => void
  addClient: (client: Omit<Client, "id" | "createdAt">) => void
  updateClient: (id: string, client: Partial<Client>) => void
  removeClient: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      policyFiles: [],
      clients: [],
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
      addPolicyFile: (name, fileName, fileContent) => {
        const newId = crypto.randomUUID()
        set((state) => ({
          policyFiles: [
            ...state.policyFiles,
            {
              id: newId,
              name,
              fileName,
              fileContent,
              uploadedAt: new Date().toISOString(),
            },
          ],
        }))
      },
      addPolicyFiles: (files) => {
        const newPolicies = files.map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          fileName: file.fileName,
          fileContent: file.fileContent,
          uploadedAt: new Date().toISOString(),
        }))
        set((state) => ({
          policyFiles: [...state.policyFiles, ...newPolicies],
        }))
      },
      removePolicyFile: (id) =>
        set((state) => ({
          policyFiles: state.policyFiles.filter((p) => p.id !== id),
        })),
      clearAllPolicyFiles: () => set({ policyFiles: [] }),
      addClient: (client) => {
        const newId = crypto.randomUUID()
        const newClient = {
          ...client,
          id: newId,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          clients: [...state.clients, newClient],
        }))
      },
      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      removeClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),
    }),
{
      name: "seccomply-storage",
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
