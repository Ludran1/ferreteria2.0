import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoaded } = useAuth(); // Wait for auth check
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión', {
        description: error.message || 'Credenciales inválidas',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-orange mb-6">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Ingresar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
