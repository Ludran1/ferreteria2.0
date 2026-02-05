import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManageCategoriesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: string[];
    onUpdateCategories: (categories: string[]) => void;
}

export function ManageCategoriesModal({ open, onOpenChange, categories = [], onUpdateCategories }: ManageCategoriesModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  // No need to sync local state if we use props directly, 
  // but if we want optimistic UI we just use the props as source of truth
  // since the parent holds the state.
  
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      toast({
        title: "Error",
        description: "Esta categoría ya existe",
        variant: "destructive"
      });
      return;
    }

    const updated = [...categories, newCategory.trim()];
    onUpdateCategories(updated);
    setNewCategory('');
    toast({
      title: "Categoría agregada",
      description: `Se agregó "${newCategory}" exitosamente.`
    });
  };

  const handleDeleteCategory = (index: number) => {
    const categoryToDelete = categories[index];
    const updated = categories.filter((_, i) => i !== index);
    onUpdateCategories(updated);
    toast({
      title: "Categoría eliminada",
      description: `Se eliminó "${categoryToDelete}".`
    });
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(categories[index]);
  };

  const saveEdit = (index: number) => {
    if (!editValue.trim()) return;
    if (categories.some((c, i) => i !== index && c === editValue.trim())) {
       toast({
        title: "Error",
        description: "Ya existe otra categoría con este nombre",
        variant: "destructive"
      });
      return;
    }

    const updated = [...categories];
    updated[index] = editValue.trim();
    onUpdateCategories(updated);
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between gap-2 rounded-lg border p-2 bg-secondary/20">
                {editingIndex === index ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(index);
                            if (e.key === 'Escape') setEditingIndex(null);
                        }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => saveEdit(index)}>
                        <Save className="h-4 w-4" />
                    </Button>
                     <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingIndex(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{category}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditing(index)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCategory(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No hay categorías registradas</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
