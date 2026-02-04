import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProducts, mockCategories } from '@/data/mockData';
import { Plus, Search, Package, Edit, Trash2 } from 'lucide-react';
import { CreateProductModal } from '@/components/products/CreateProductModal';
import { ManageCategoriesModal } from '@/components/products/ManageCategoriesModal';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(mockCategories);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm) ||
      product.additionalBarcodes?.some(code => code.includes(searchTerm));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout title="Productos" subtitle="Gestiona tu inventario">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
            <ManageCategoriesModal 
                initialCategories={categories} 
                onUpdateCategories={setCategories} 
            />
            <CreateProductModal categories={categories} />
        </div>
      </div>

      {/* Category Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="group overflow-hidden rounded-2xl bg-card p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Product Image Placeholder */}
            <div className="flex h-32 items-center justify-center rounded-xl bg-secondary/50">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>

            {/* Product Info */}
            <div className="mt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
                  {product.barcode && (
                    <p className="text-xs text-muted-foreground">Código: {product.barcode}</p>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  S/ {product.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="secondary" size="sm" className="flex-1 gap-1">
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No se encontraron productos
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}
    </MainLayout>
  );
}
