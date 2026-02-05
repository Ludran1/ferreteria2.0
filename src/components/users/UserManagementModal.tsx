import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Plus, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  name: z.string().min(3, 'Nombre requerido'),
});

type UserFormData = z.infer<typeof userSchema>;

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ventas', label: 'Historial de Ventas' },
  { id: 'productos', label: 'Productos' },
  { id: 'cotizaciones', label: 'Cotizaciones' },
  { id: 'guias', label: 'Guías de Remisión' },
  { id: 'configuracion', label: 'Configuración' },
  { id: 'usuarios', label: 'Gestión de Usuarios' },
];

interface Profile {
    id: string;
    email: string;
    name: string;
    role: string;
    allowed_sections: string[];
}

export function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = async () => {
      setFetching(true);
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error) {
          console.error('Error fetching profiles:', error);
          toast.error("Error al cargar usuarios");
      } else {
          setUsers(data || []);
      }
      setFetching(false);
  };

  useEffect(() => {
    if (isOpen && view === 'list') {
        fetchUsers();
    }
  }, [isOpen, view]);

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'employee',
            allowedSections: selectedSections,
          },
        },
      });

      if (error) throw error;

      toast.success('Usuario creado exitosamente', {
        description: 'El empleado ha sido registrado y aparecerá en la lista.'
      });
      
      reset();
      setSelectedSections([]);
      setView('list'); // Switch back to list view
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) setView('list');
        onClose();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Gestión de Usuarios</span>
            {view === 'list' && (
                <Button size="sm" onClick={() => setView('create')} className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Usuario
                </Button>
            )}
            {view === 'create' && (
                <Button size="sm" variant="ghost" onClick={() => setView('list')}>
                    Volver a la lista
                </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {view === 'list' ? (
            <div className="py-4">
                {fetching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Accesos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                     <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                            No se encontraron usuarios.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                                    {user.name?.substring(0,2).toUpperCase()}
                                                </div>
                                                {user.name}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                                    {user.role === 'admin' ? 'Admin' : 'Empleado'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {user.allowed_sections?.slice(0, 3).map(sec => (
                                                        <span key={sec} className="text-[10px] bg-secondary px-1 rounded text-muted-foreground">
                                                            {SECTIONS.find(s => s.id === sec)?.label || sec}
                                                        </span>
                                                    ))}
                                                    {(user.allowed_sections?.length || 0) > 3 && (
                                                        <span className="text-[10px] text-muted-foreground">+{user.allowed_sections!.length - 3} más</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        ) : (
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" {...register('name')} placeholder="Juan Pérez" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="empleado@empresa.com" />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" {...register('password')} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-3 pt-2">
                    <Label>Accesos Permitidos (Secciones)</Label>
                    <div className="grid grid-cols-2 gap-3 border rounded-md p-3">
                    {SECTIONS.map((section) => (
                        <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={section.id} 
                            checked={selectedSections.includes(section.id)}
                            onCheckedChange={() => toggleSection(section.id)}
                        />
                        <label 
                            htmlFor={section.id} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            {section.label}
                        </label>
                        </div>
                    ))}
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setView('list')} disabled={loading}>
                    Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                        </>
                    ) : 'Crear Usuario'}
                    </Button>
                </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
