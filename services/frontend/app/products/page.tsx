"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { productsAPI, cartAPI } from "@/lib/api";
import { ShoppingCart, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Cookies from "js-cookie";

interface Product {
  id: string; name: string; price: number; image_url: string; stock: number; category_id: string;
}
interface Category {
  id: string; name: string;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category_id") || "");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    productsAPI.getCategories()
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    productsAPI.getAll({ page, limit: 12, q: search || undefined, category_id: selectedCategory || undefined })
      .then(res => {
        setProducts(res.data.products);
        setTotalPages(res.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, selectedCategory]);

  const handleAddToCart = async (product: Product) => {
    const userId = Cookies.get("userId");
    if (!userId) { window.location.href = "/auth/login"; return; }
    setAddingToCart(product.id);
    try {
      const res = await cartAPI.add(userId, {
        productId: product.id, name: product.name, price: product.price,
        image_url: product.image_url, quantity: 1,
      });
      localStorage.setItem(`cart_${userId}`, JSON.stringify(res.data.cart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {}
    setAddingToCart(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
            className="pl-10 pr-8 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
              <div className="skeleton h-52 w-full" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No products found.</p>
          <button onClick={() => { setSearch(""); setSelectedCategory(""); }} className="mt-4 text-indigo-400 hover:text-indigo-300">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/50 card-glow transition-all duration-300"
            >
              <Link href={`/products/${product.id}`}>
                <div className="relative overflow-hidden h-52">
                  <img
                    src={product.image_url || "https://picsum.photos/seed/product/400/300"}
                    alt={product.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/400/300`; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                      <span className="text-gray-300 font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-gray-100 hover:text-indigo-400 transition-colors text-sm leading-snug mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-indigo-400">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0 || addingToCart === product.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    {addingToCart === product.id ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
