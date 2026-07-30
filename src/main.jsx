import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './router/AppRouter';


const queryClient = new QueryClient({
  defaultOptions:{
    queries: {
      refetchOnWindowFocus: false, // evitar refetch al cambiar de pestaña
      retry: 1, // reintentar una vez en caso de error
    },
  },
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter/>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
