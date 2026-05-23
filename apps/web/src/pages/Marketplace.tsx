import { useSuperhostStore } from '../store/useSuperhostStore';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function Marketplace() {
  const { addToCart, cart } = useSuperhostStore();

  const products = [
    { id: 1, name: 'Premium Linens Set', price: 89, category: 'Bedding', inStock: true },
    { id: 2, name: 'Luxury Towel Bundle', price: 45, category: 'Bath', inStock: true },
    { id: 3, name: 'Coffee & Tea Starter Kit', price: 32, category: 'Kitchen', inStock: false },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
          <p className="text-[#8B7B6B] mt-1">Order supplies • {cart.length} items in cart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-[#E8E0D8] rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-[#1A1914]">{product.name}</h3>
                <p className="text-sm text-[#8B7B6B]">{product.category}</p>
              </div>
              <Badge variant={product.inStock ? 'success' : 'warning'}>
                {product.inStock ? 'In Stock' : 'Backorder'}
              </Badge>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between">
              <div className="text-2xl font-semibold text-[#1A1914]">${product.price}</div>
              <Button size="sm" disabled={!product.inStock} onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}>
                {product.inStock ? 'Add to Cart' : 'Notify Me'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
