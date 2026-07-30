"use client";
import { useEffect, useState } from "react";
import { ordersAPI } from "@/lib/api";
import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending:    { icon: Clock, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", label: "Pending" },
  paid:       { icon: CheckCircle, color: "text-green-400 bg-green-400/10 border-green-400/20", label: "Paid" },
  processing: { icon: Package, color: "text-blue-400 bg-blue-400/10 border-blue-400/20", label: "Processing" },
  shipped:    { icon: Truck, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", label: "Shipped" },
  delivered:  { icon: CheckCircle, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Delivered" },
  cancelled:  { icon: XCircle, color: "text-red-400 bg-red-400/10 border-red-400/20", label: "Cancelled" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const uid = Cookies.get("userId");
    if (!uid) { window.location.href = "/auth/login"; return; }
    setUserId(uid);
    ordersAPI.getByUser(uid)
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-20 h-20 text-gray-700 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-300 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-8">When you place an order, it will appear here.</p>
          <Link href="/products" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-fade-in-up hover:border-gray-700 transition-colors" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-mono mb-1">{order.id}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-xl font-bold text-indigo-400">${parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && order.items[0] !== null && (
                  <div className="border-t border-gray-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items.slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-400">
                        <span className="truncate flex-1 mr-2">{item.product_name} × {item.quantity}</span>
                        <span>${parseFloat(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <p className="text-xs text-gray-600">+{order.items.length - 4} more items</p>
                    )}
                  </div>
                )}

                {order.shipping_address && (
                  <div className="mt-3 text-xs text-gray-600">
                    📦 {order.shipping_address.address}, {order.shipping_address.city}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
