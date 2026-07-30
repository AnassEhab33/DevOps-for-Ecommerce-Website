"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productsAPI, cartAPI } from "@/lib/api";
import { ShoppingCart, Package, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (id) {
      productsAPI.getById(id as string)
        .then(res => setProduct(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddToCart = async () => {
    const userId = Cookies.get("userId");
    if (!userId) { window.location.href = "/auth/login"; return; }
    setAdding(true);
    try {
      const res = await cartAPI.add(userId, {
        productId: product.id, name: product.name, price: product.price,
        image_url: product.image_url, quantity,
      });
      localStorage.setItem(`cart_${userId}`, JSON.stringify(res.data.cart));
      window.dispatchEvent(new Event("cartUpdated"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {}
    setAdding(false);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-6 w-1/4" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p className="text-xl text-gray-400">Product not found</p>
      <Link href="/products" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">← Back to products</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Link href="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in-up">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 h-96">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-3">{product.name}</h1>
            <p className="text-4xl font-black text-indigo-400">${product.price.toFixed(2)}</p>
          </div>

          <p className="text-gray-400 leading-relaxed">{product.description}</p>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            product.stock === 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
            product.stock < 10 ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
            "bg-green-500/10 text-green-400 border border-green-500/20"
          }`}>
            {product.stock === 0 ? "Out of Stock" : product.stock < 10 ? `Only ${product.stock} left` : `${product.stock} in stock`}
          </div>

          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-gray-400 text-sm">Quantity:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors"
                  >−</button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors"
                  >+</button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-lg transition-all ${
                  added
                    ? "bg-green-600 text-white"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25"
                } disabled:opacity-60`}
              >
                {added ? (
                  <><CheckCircle className="w-5 h-5" /> Added to Cart!</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> {adding ? "Adding..." : "Add to Cart"}</>
                )}
              </button>

              <Link
                href="/cart"
                className="block w-full text-center py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white transition-all font-medium"
              >
                View Cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
