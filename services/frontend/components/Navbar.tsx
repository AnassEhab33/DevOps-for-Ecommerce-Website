"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, User, Menu, X, Package } from "lucide-react";
import Cookies from "js-cookie";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const userData = Cookies.get("user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }

    const updateCart = () => {
      const userId = Cookies.get("userId");
      if (userId) {
        const cart = localStorage.getItem(`cart_${userId}`);
        if (cart) {
          const parsed = JSON.parse(cart);
          setCartCount(parsed.itemCount || 0);
        }
      }
    };

    updateCart();
    window.addEventListener("cartUpdated", updateCart);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("cartUpdated", updateCart);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    Cookies.remove("userId");
    setUser(null);
    setCartCount(0);
    window.location.href = "/";
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-2xl"
        : "bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/50"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">ShopHub</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Products
            </Link>
            {user && (
              <Link href="/orders" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                My Orders
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors group">
              <ShoppingCart className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full text-xs flex items-center justify-center font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Hi, {user.name?.split(" ")[0]}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all text-white font-medium">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-3">
          <Link href="/products" className="block text-gray-400 hover:text-white py-2" onClick={() => setIsOpen(false)}>Products</Link>
          <Link href="/cart" className="block text-gray-400 hover:text-white py-2" onClick={() => setIsOpen(false)}>Cart ({cartCount})</Link>
          {user ? (
            <>
              <Link href="/orders" className="block text-gray-400 hover:text-white py-2" onClick={() => setIsOpen(false)}>My Orders</Link>
              <button onClick={handleLogout} className="block w-full text-left text-gray-400 hover:text-white py-2">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-gray-400 hover:text-white py-2" onClick={() => setIsOpen(false)}>Login</Link>
              <Link href="/auth/register" className="block text-gray-400 hover:text-white py-2" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
