"use client";
import { useEffect, useState } from "react";
import { cartAPI, ordersAPI, paymentsAPI } from "@/lib/api";
import { CreditCard, MapPin, CheckCircle, Loader } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

type Step = "shipping" | "payment" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("shipping");
  const [cart, setCart] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shipping, setShipping] = useState({
    fullName: "", address: "", city: "", state: "", zip: "", country: "US",
  });
  const [payment, setPayment] = useState({
    card_number: "", card_holder: "", expiry_month: "", expiry_year: "", cvv: "",
  });

  useEffect(() => {
    const uid = Cookies.get("userId");
    if (!uid) { router.push("/auth/login"); return; }
    setUserId(uid);
    cartAPI.get(uid).then(res => setCart(res.data)).catch(() => {});
  }, []);

  if (!userId) return null;

  const handleShippingNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.fullName || !shipping.address || !shipping.city || !shipping.zip) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setStep("payment");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const total = (cart.total || 0) + (cart.total >= 50 ? 0 : 9.99);

      // Process payment first
      const paymentRes = await paymentsAPI.process({
        order_id: `temp-${Date.now()}`,
        amount: total,
        card_number: payment.card_number.replace(/\s/g, ""),
        card_holder: payment.card_holder,
        expiry_month: parseInt(payment.expiry_month),
        expiry_year: parseInt(payment.expiry_year),
        cvv: payment.cvv,
      });

      if (paymentRes.data.status !== "success") {
        setError(paymentRes.data.message || "Payment failed");
        setLoading(false);
        return;
      }

      // Create order
      const orderItems = cart.items.map((item: any) => ({
        productId: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const orderRes = await ordersAPI.create({
        userId: userId!,
        items: orderItems,
        shippingAddress: shipping,
        paymentId: paymentRes.data.payment_id,
      });

      const newOrderId = orderRes.data.order.id;
      setOrderId(newOrderId);

      // Clear cart
      await cartAPI.clear(userId!);
      localStorage.removeItem(`cart_${userId}`);
      window.dispatchEvent(new Event("cartUpdated"));

      setStep("success");
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const formatCard = (val: string) => {
    return val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  };

  if (!cart) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="skeleton h-8 w-1/2 mx-auto mb-4" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (!cart.items || cart.items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
      <Link href="/products" className="text-indigo-400 hover:text-indigo-300">Browse Products</Link>
    </div>
  );

  const subtotal = cart.total || 0;
  const shipping_cost = subtotal >= 50 ? 0 : 9.99;
  const total = subtotal + shipping_cost;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Steps */}
      {step !== "success" && (
        <div className="flex items-center gap-4 mb-10">
          {(["shipping", "payment"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? "bg-indigo-600 text-white" :
                (step === "payment" && s === "shipping") ? "bg-green-600 text-white" :
                "bg-gray-800 text-gray-500"
              }`}>
                {step === "payment" && s === "shipping" ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium capitalize ${step === s ? "text-white" : "text-gray-500"}`}>{s}</span>
              {i === 0 && <div className="w-16 h-px bg-gray-800 mx-1" />}
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {step === "success" && (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Order Placed!</h1>
          <p className="text-gray-400 mb-2">Thank you for your purchase.</p>
          <p className="text-gray-500 text-sm mb-8">Order ID: <span className="text-indigo-400 font-mono">{orderId}</span></p>
          <div className="flex gap-4 justify-center">
            <Link href="/orders" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors">
              View Orders
            </Link>
            <Link href="/products" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Shipping Step */}
      {step === "shipping" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" /> Shipping Address
            </h2>
            <form onSubmit={handleShippingNext} className="space-y-4">
              <input
                placeholder="Full Name *"
                value={shipping.fullName}
                onChange={e => setShipping({...shipping, fullName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <input
                placeholder="Street Address *"
                value={shipping.address}
                onChange={e => setShipping({...shipping, address: e.target.value})}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="City *"
                  value={shipping.city}
                  onChange={e => setShipping({...shipping, city: e.target.value})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <input
                  placeholder="State"
                  value={shipping.state}
                  onChange={e => setShipping({...shipping, state: e.target.value})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="ZIP Code *"
                  value={shipping.zip}
                  onChange={e => setShipping({...shipping, zip: e.target.value})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <input
                  placeholder="Country"
                  value={shipping.country}
                  onChange={e => setShipping({...shipping, country: e.target.value})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all">
                Continue to Payment →
              </button>
            </form>
          </div>
          <div>
            <OrderSummary cart={cart} total={total} subtotal={subtotal} shippingCost={shipping_cost} />
          </div>
        </div>
      )}

      {/* Payment Step */}
      {step === "payment" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" /> Payment Details
            </h2>
            <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">
              💡 Test: Use any card number. Cards ending in <strong>0000</strong> will be declined.
            </div>
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <input
                placeholder="Card Number (e.g. 4111 1111 1111 1111)"
                value={payment.card_number}
                onChange={e => setPayment({...payment, card_number: formatCard(e.target.value)})}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
              <input
                placeholder="Cardholder Name"
                value={payment.card_holder}
                onChange={e => setPayment({...payment, card_holder: e.target.value})}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  placeholder="MM"
                  value={payment.expiry_month}
                  onChange={e => setPayment({...payment, expiry_month: e.target.value.slice(0, 2)})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <input
                  placeholder="YYYY"
                  value={payment.expiry_year}
                  onChange={e => setPayment({...payment, expiry_year: e.target.value.slice(0, 4)})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <input
                  placeholder="CVV"
                  value={payment.cvv}
                  onChange={e => setPayment({...payment, cvv: e.target.value.slice(0, 4)})}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("shipping")}
                  className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all disabled:opacity-60">
                  {loading ? <><Loader className="w-4 h-4 animate-spin" /> Processing...</> : `Pay $${total.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
          <div>
            <OrderSummary cart={cart} total={total} subtotal={subtotal} shippingCost={shipping_cost} />
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ cart, total, subtotal, shippingCost }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="font-bold mb-4">Order Summary</h3>
      <div className="space-y-2 mb-4">
        {cart.items?.map((item: any) => (
          <div key={item.productId} className="flex justify-between text-sm text-gray-400">
            <span className="truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 pt-3 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Shipping</span>
          <span className={shippingCost === 0 ? "text-green-400" : ""}>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-800 pt-2">
          <span>Total</span><span className="text-indigo-400">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
