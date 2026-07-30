"use client";
import { useEffect, useState } from "react";
import { cartAPI } from "@/lib/api";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

export default function CartPage() {
  const [cart, setCart] = useState<any>({ items: [], total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const uid = Cookies.get("userId");
    setUserId(uid || null);
    if (uid) {
      cartAPI.get(uid)
        .then(res => setCart(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const updateQty = async (productId: string, quantity: number) => {
    if (!userId) return;
    if (quantity < 1) return removeItem(productId);
    try {
      const res = await cartAPI.updateQty(userId, productId, quantity);
      setCart(res.data.cart);
      localStorage.setItem(`cart_${userId}`, JSON.stringify(res.data.cart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {}
  };

  const removeItem = async (productId: string) => {
    if (!userId) return;
    try {
      const res = await cartAPI.removeItem(userId, productId);
      setCart(res.data.cart);
      localStorage.setItem(`cart_${userId}`, JSON.stringify(res.data.cart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {}
  };

  const clearCart = async () => {
    if (!userId) return;
    try {
      await cartAPI.clear(userId);
      setCart({ items: [], total: 0, itemCount: 0 });
      localStorage.removeItem(`cart_${userId}`);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {}
  };

  if (!userId) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-300 mb-2">Please log in to view your cart</h2>
      <Link href="/auth/login" className="mt-4 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors">
        Login
      </Link>
    </div>
  );

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
    </div>
  );

  if (!cart.items || cart.items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart className="w-20 h-20 text-gray-700 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-200 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Start adding some products to your cart.</p>
      <Link href="/products" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all">
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-300 transition-colors">
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: any) => (
            <div key={item.productId} className="flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl animate-fade-in-up">
              <img
                src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`}>
                  <h3 className="font-semibold text-gray-100 hover:text-indigo-400 transition-colors text-sm leading-snug mb-1 truncate">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-indigo-400 font-bold">${item.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <p className="font-bold text-gray-200">${(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeItem(item.productId)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>${(cart.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Shipping</span>
                <span className="text-green-400">{cart.total >= 50 ? "Free" : "$9.99"}</span>
              </div>
              <div className="border-t border-gray-800 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-indigo-400">
                  ${((cart.total || 0) + (cart.total >= 50 ? 0 : 9.99)).toFixed(2)}
                </span>
              </div>
            </div>
            <Link href="/checkout" className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/25">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products" className="block text-center mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
