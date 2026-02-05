import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Quotes from "./pages/Quotes";
import Credits from "./pages/Credits";
import Sales from "./pages/Sales";
import RemissionGuides from "./pages/RemissionGuides";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/cotizaciones" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
            <Route path="/ventas" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/guias" element={<ProtectedRoute><RemissionGuides /></ProtectedRoute>} />
            <Route path="/creditos" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
