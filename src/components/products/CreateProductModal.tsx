import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { DEFAULT_CATEGORIES } from '@/constants/data';

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: (product: any) => void;
  onProductUpdated?: (product: Product) => void;
  categories?: string[];
  productToEdit?: Product | null;
}

export function CreateProductModal({ open, onOpenChange, onProductCreated, categories = DEFAULT_CATEGORIES, productToEdit, ...props }: CreateProductModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
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

  // Reset or Populate form when modal opens
  useEffect(() => {
    if (open) {
      if (productToEdit) {
          setFormData({
            name: productToEdit.name,
            sku: productToEdit.sku,
            barcode: productToEdit.barcode || '',
            additionalBarcodes: productToEdit.additionalBarcodes || [],
            category: productToEdit.category,
            price: productToEdit.price.toString(),
            description: productToEdit.description
          });
      } else {
          setFormData({
            name: '',
            sku: '',
            barcode: '',
            additionalBarcodes: [],
            category: '',
            price: '',
            description: ''
          });
      }
      setNewBarcode('');
    }
  }, [open, productToEdit]);

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

    try {
        if (productToEdit) {
            // Update
            // @ts-ignore
             if (props.onProductUpdated) await props.onProductUpdated({ ...productToEdit, ...formData, price: Number(formData.price) });
        } else {
             // Create
             // @ts-ignore
             if (onProductCreated) await onProductCreated({ ...formData, price: Number(formData.price) });
        }
        
        onOpenChange(false);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</DialogTitle>
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
                  {categories.map((cat) => (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Guardar Producto')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
