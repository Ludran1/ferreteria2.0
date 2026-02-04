import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { mockCategories } from '@/data/mockData';

interface CreateProductModalProps {
  onProductCreated?: (product: Product) => void;
  categories?: string[];
}

export function CreateProductModal({ onProductCreated, categories = mockCategories }: CreateProductModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    additionalBarcodes: [] as string[],
    category: '',
    price: '',
    description: ''
  });

  const [newBarcode, setNewBarcode] = useState('');

  const handleAddBarcode = () => {
    if (newBarcode.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalBarcodes: [...prev.additionalBarcodes, newBarcode.trim()]
      }));
      setNewBarcode('');
    }
  };

  const handleRemoveBarcode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalBarcodes: prev.additionalBarcodes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Basic Validation
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    console.log('Product Created:', formData);
    toast({
      title: "Producto creado",
      description: "Producto creado exitosamente"
    });
    
    setLoading(false);
    setOpen(false);
    
    // Reset form
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      additionalBarcodes: [],
      category: '',
      price: '',
      description: ''
    });

    if (onProductCreated) {
        // Cast to any/Product for property matching since specific ID logic isn't here
        onProductCreated({ ...formData, id: Date.now().toString(), price: Number(formData.price) } as unknown as Product);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Martillo"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="(Auto)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="barcode">Código Principal</Label>
              <Input
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="750..."
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Códigos Adicionales</Label>
            <div className="flex gap-2">
                <Input 
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    placeholder="Escanear o escribir..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBarcode();
                        }
                    }}
                />
                <Button type="button" size="icon" variant="secondary" onClick={handleAddBarcode}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            
            {formData.additionalBarcodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {formData.additionalBarcodes.map((code, index) => (
                        <div key={index} className="flex items-center bg-secondary px-2 py-1 rounded-md text-xs">
                            <span>{code}</span>
                            <button 
                                type="button"
                                onClick={() => handleRemoveBarcode(index)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select onValueChange={handleCategoryChange} value={formData.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Precio *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">S/</span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalles del producto..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
