from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
import random

app = FastAPI(title="Payment Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory payment store (for demo — replace with DB in prod)
payments_store: dict = {}

# ─── Schemas ───
class PaymentRequest(BaseModel):
    order_id: str
    amount: float
    card_number: str
    card_holder: str
    expiry_month: int
    expiry_year: int
    cvv: str

class PaymentResponse(BaseModel):
    payment_id: str
    order_id: str
    amount: float
    status: str
    message: str
    timestamp: str

# ─── Health ───
@app.get("/health")
def health():
    return {"status": "healthy", "service": "payment-service"}

# ─── Process Payment ───
@app.post("/api/payments/process", response_model=PaymentResponse)
def process_payment(payment: PaymentRequest):
    """
    Mock payment processor.
    - Cards ending in '0000' → declined
    - Everything else → approved
    """
    payment_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    # Validate card number (basic)
    card_clean = payment.card_number.replace(" ", "").replace("-", "")
    if not card_clean.isdigit() or len(card_clean) < 13 or len(card_clean) > 19:
        raise HTTPException(status_code=400, detail="Invalid card number format")

    # Simulate decline for cards ending in 0000
    if card_clean.endswith("0000"):
        result = {
            "payment_id": payment_id,
            "order_id": payment.order_id,
            "amount": payment.amount,
            "status": "failed",
            "message": "Card declined. Please try a different card.",
            "timestamp": timestamp
        }
    else:
        result = {
            "payment_id": payment_id,
            "order_id": payment.order_id,
            "amount": payment.amount,
            "status": "success",
            "message": "Payment processed successfully",
            "timestamp": timestamp
        }

    payments_store[payment_id] = result
    payments_store[f"order:{payment.order_id}"] = result

    return result

# ─── Get Payment by ID ───
@app.get("/api/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: str):
    payment = payments_store.get(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

# ─── Get Payment by Order ID ───
@app.get("/api/payments/order/{order_id}", response_model=PaymentResponse)
def get_payment_by_order(order_id: str):
    payment = payments_store.get(f"order:{order_id}")
    if not payment:
        raise HTTPException(status_code=404, detail="No payment found for this order")
    return payment
