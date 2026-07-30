from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from pydantic import BaseModel
from decimal import Decimal
import uuid
import os
from .database import get_db, init_db, Product, Category

app = FastAPI(title="Product Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ───
class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price: float
    stock: int
    category_id: Optional[str]
    image_url: Optional[str]

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    category_id: Optional[str] = None
    image_url: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

# ─── On startup ───
@app.on_event("startup")
def startup():
    init_db()

# ─── Health ───
@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {"status": "healthy", "service": "product-service", "db": "connected"}
    except:
        raise HTTPException(status_code=503, detail="DB unavailable")

# ─── Categories ───
@app.get("/api/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

# ─── Products ───
@app.get("/api/products")
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    category_id: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if q:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{q}%"),
                Product.description.ilike(f"%{q}%")
            )
        )

    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "price": float(p.price),
                "stock": p.stock,
                "category_id": str(p.category_id) if p.category_id else None,
                "image_url": p.image_url,
            }
            for p in products
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(product.id),
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "stock": product.stock,
        "category_id": str(product.category_id) if product.category_id else None,
        "image_url": product.image_url,
    }

@app.post("/api/products", status_code=201)
def create_product(body: ProductCreate, db: Session = Depends(get_db)):
    product = Product(
        name=body.name,
        description=body.description,
        price=body.price,
        stock=body.stock,
        category_id=uuid.UUID(body.category_id) if body.category_id else None,
        image_url=body.image_url
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"id": str(product.id), "message": "Product created"}

@app.put("/api/products/{product_id}/stock")
def update_stock(product_id: str, body: dict, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.stock = body.get("stock", product.stock)
    db.commit()
    return {"message": "Stock updated", "stock": product.stock}
