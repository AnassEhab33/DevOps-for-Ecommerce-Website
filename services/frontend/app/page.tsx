"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { productsAPI, cartAPI } from "@/lib/api";
import { ShoppingCart, Search, Star, Zap, Shield, Truck } from "lucide-react";
import Cookies from "js-cookie";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  category_id: string;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    productsAPI.getAll({ limit: 8 })
      .then(res => setFeatured(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product: Product) => {
    const userId = Cookies.get("userId");
    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }
    setAddingToCart(product.id);
    try {
      const res = await cartAPI.add(userId, {
        productId: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
      });
      const cart = res.data.cart;
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {}
    setAddingToCart(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            New arrivals every week
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            Shop the{" "}
            <span className="gradient-text">Future</span>{" "}
            Today
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Discover premium products across electronics, fashion, home & more.
            Fast delivery, easy returns.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Search
            </button>
          </form>

          <div className="flex justify-center gap-8 mt-10 text-sm text-gray-500">
            <Link href="/products?category=electronics" className="hover:text-gray-300 transition-colors">Electronics</Link>
            <Link href="/products?category=clothing" className="hover:text-gray-300 transition-colors">Clothing</Link>
            <Link href="/products?category=books" className="hover:text-gray-300 transition-colors">Books</Link>
            <Link href="/products?category=sports" className="hover:text-gray-300 transition-colors">Sports</Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-gray-900 border-y border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8">
          {[
            { icon: Truck, label: "Free Shipping over $50" },
            { icon: Shield, label: "Secure Checkout" },
            { icon: Star, label: "5-Star Reviews" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-gray-400 text-sm">
              <Icon className="w-5 h-5 text-indigo-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Featured Products</h2>
            <p className="text-gray-500 mt-1">Hand-picked selections just for you</p>
          </div>
          <Link
            href="/products"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product, i) => (
              <div
                key={product.id}
                className="group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/50 card-glow transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={product.image_url || "https://picsum.photos/seed/product/400/300"}
                      alt={product.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/400/300`; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.stock < 10 && product.stock > 0 && (
                      <span className="absolute top-2 right-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full">
                        Only {product.stock} left
                      </span>
                    )}
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
                    <span className="text-xl font-bold text-indigo-400">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || addingToCart === product.id}
                      className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
