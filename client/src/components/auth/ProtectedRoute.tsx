
import { ReactNode } from 'react'
// import { useAuth } from '@/contexts/AuthContext'
// import { useLocation } from 'wouter'
// import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // TEMPORARY: Auth protection disabled to allow app usage without login.
  // To re-enable, uncomment the block below and the imports above.
  // const { user, loading } = useAuth()
  // const [, setLocation] = useLocation()
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <Loader2 className="w-8 h-8 animate-spin text-primary" />
  //     </div>
  //   )
  // }
  // if (!user) {
  //   setLocation('/auth')
  //   return null
  // }
  return <>{children}</>
}
