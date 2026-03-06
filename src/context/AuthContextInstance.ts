import { createContext } from 'react'
import type { AuthContextType } from './AuthContext'

export const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null,
  loading: true, isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})