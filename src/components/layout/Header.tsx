import { Bell, Search, User, LogOut, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useRemissionGuides } from '@/hooks/useRemissionGuides';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { guides } = useRemissionGuides();
  const navigate = useNavigate();

  const pendingGuides = (guides || []).filter(g => g.status === 'pending');
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const userName = user?.user_metadata?.name || user?.email || 'Usuario';
  const authRole = user?.user_metadata?.role === 'admin' ? 'Administrador' : 'Vendedor';

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos, clientes..."
            className="w-64 pl-10 bg-secondary/50 border-0 focus-visible:ring-primary"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {pendingGuides.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                        {pendingGuides.length}
                    </span>
                )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pendingGuides.length === 0 ? (
                     <div className="p-4 text-center text-muted-foreground text-sm">
                        No tienes notificaciones pendientes.
                     </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {pendingGuides.map(guide => (
                            <DropdownMenuItem key={guide.id} className="cursor-pointer" onClick={() => navigate('/guias')}>
                                <div className="flex gap-3 items-start">
                                    <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                                        <Truck className="h-4 w-4 text-warning" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Guía Pendiente: {guide.id.slice(0,8)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Cliente: {guide.customerName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {format(new Date(guide.date), 'dd MMM HH:mm', { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
               {userInitials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <Badge variant="outline" className="w-fit mt-1 text-[10px]">
                    {authRole}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
