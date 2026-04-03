import { Link } from 'react-router-dom'
import { signInWithGoogle, signOut } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, loading } = useAuth()

  const handleAuth = async () => {
    try {
      if (user) {
        await signOut()
      } else {
        await signInWithGoogle()
      }
    } catch (err) {
      console.error('Auth error:', err)
    }
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </span>
          <span className="text-lg font-bold text-slate-900">DemoAI</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/report/get"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Sample Report
          </Link>
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 hidden sm:block truncate max-w-[140px]">
                    {user.email}
                  </span>
                  <button
                    onClick={handleAuth}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAuth}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                >
                  Sign in
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
