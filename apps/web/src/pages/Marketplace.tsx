import { useSuperhostStore } from '../store/useSuperhostStore';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
export default function Marketplace() {
  const { addToCart, cart } = useSuperhostStore();
  const products = [{ id: 1, name: 'Premium Linens', price: 89, category: 'Bedding', inStock: true }];
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
      <div className="mt-6">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-[#E8E0D8] rounded-2xl p-6 mb-4">
            <div className="flex justify-between">
              <div><h3 className="font-semibold">{p.name}</h3><p className="text-sm text-[#8B7B6B]">{p.category}</p></div>
              <Badge variant={p.inStock ? 'success' : 'warning'}>{p.inStock ? 'In Stock' : 'Backorder'}</Badge>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xl font-semibold">${p.price}</span>
              <Button size="sm" onClick={() => addToCart({ id: p.id, name: p.name, price: p.price })}>Add to Cart</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
