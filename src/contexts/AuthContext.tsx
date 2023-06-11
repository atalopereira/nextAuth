import { setupAPIClient } from "@/services/api";
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import { useRouter } from 'next/navigation';
import { ReactNode, createContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context";

type User = {
  email: string,
  permissions: string[],
  roles: string[]
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: (router: AppRouterInstance) => void;
  user: User | undefined;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut(router: AppRouterInstance, activeBroadcast = true) {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  if (activeBroadcast) {
    authChannel.postMessage('SignOut');
  }

  router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const router = useRouter();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel('auth');

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case 'SignOut':
          signOut(router, false);
          break;
        default:
          break;
      }
    }
  }, [])

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies()

    if (token) {
      api.get('/me')
      .then(response => {
        const { email, permissions, roles } = response.data;
        setUser({ email, permissions, roles })
      })
      .catch(() => {
        signOut(router)
      })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('sessions', {
        email,
        password,
      })

      const { token, refreshToken, permissions, roles } = response.data;
  
      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      router.push('/dashboard');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}