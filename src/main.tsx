import './index.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4 bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-2">Algo salió mal 😭</h2>
      <pre className="text-sm bg-red-100 p-4 rounded mb-4 max-w-lg overflow-auto">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Intentar de nuevo
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>,
)
