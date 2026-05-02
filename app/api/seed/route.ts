import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    return NextResponse.json({ message: "La base de datos ya tiene datos. No se volvió a sembrar." });
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: { name: "Administrador", email: "admin@cafeteria.com", password: hashedPassword, role: "admin" },
  });

  const categories = [
    { name: "Bebidas de café", color: "#92400E" },
    { name: "Soda italiana", color: "#7C3AED" },
    { name: "Té", color: "#166534" },
    { name: "Alimentos", color: "#DC2626" },
    { name: "Postres", color: "#DB2777" },
  ];

  const createdCats: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    createdCats[cat.name] = created.id;
  }

  const products = [
    { name: "Espresso", price: 35, categoryId: createdCats["Bebidas de café"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Americano", price: 40, categoryId: createdCats["Bebidas de café"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Cappuccino", price: 55, categoryId: createdCats["Bebidas de café"], stock: 80, minStock: 15, unit: "pieza" },
    { name: "Latte", price: 60, categoryId: createdCats["Bebidas de café"], stock: 80, minStock: 15, unit: "pieza" },
    { name: "Frappé de café", price: 75, categoryId: createdCats["Bebidas de café"], stock: 60, minStock: 10, unit: "pieza" },
    { name: "Café de olla", price: 40, categoryId: createdCats["Bebidas de café"], stock: 50, minStock: 10, unit: "pieza" },
    { name: "Soda italiana fresa", price: 50, categoryId: createdCats["Soda italiana"], stock: 60, minStock: 10, unit: "pieza" },
    { name: "Soda italiana limón", price: 50, categoryId: createdCats["Soda italiana"], stock: 60, minStock: 10, unit: "pieza" },
    { name: "Soda italiana mango", price: 55, categoryId: createdCats["Soda italiana"], stock: 60, minStock: 10, unit: "pieza" },
    { name: "Soda italiana maracuyá", price: 55, categoryId: createdCats["Soda italiana"], stock: 60, minStock: 10, unit: "pieza" },
    { name: "Té verde", price: 40, categoryId: createdCats["Té"], stock: 80, minStock: 15, unit: "pieza" },
    { name: "Té negro", price: 40, categoryId: createdCats["Té"], stock: 80, minStock: 15, unit: "pieza" },
    { name: "Té de manzanilla", price: 35, categoryId: createdCats["Té"], stock: 80, minStock: 15, unit: "pieza" },
    { name: "Té chai", price: 55, categoryId: createdCats["Té"], stock: 50, minStock: 10, unit: "pieza" },
    { name: "Sandwich de pollo", price: 80, categoryId: createdCats["Alimentos"], stock: 30, minStock: 5, unit: "pieza" },
    { name: "Tostadas con aguacate", price: 70, categoryId: createdCats["Alimentos"], stock: 25, minStock: 5, unit: "pieza" },
    { name: "Quiche del día", price: 65, categoryId: createdCats["Alimentos"], stock: 20, minStock: 3, unit: "pieza" },
    { name: "Ensalada César", price: 90, categoryId: createdCats["Alimentos"], stock: 15, minStock: 3, unit: "pieza" },
    { name: "Brownie de chocolate", price: 45, categoryId: createdCats["Postres"], stock: 25, minStock: 5, unit: "pieza" },
    { name: "Cheesecake de frutos rojos", price: 60, categoryId: createdCats["Postres"], stock: 15, minStock: 3, unit: "pieza" },
    { name: "Muffin de arándano", price: 40, categoryId: createdCats["Postres"], stock: 20, minStock: 4, unit: "pieza" },
    { name: "Macarons (3 piezas)", price: 65, categoryId: createdCats["Postres"], stock: 30, minStock: 5, unit: "paquete" },
  ];

  for (const product of products) {
    const created = await prisma.product.create({ data: product });
    await prisma.inventoryMovement.create({
      data: { productId: created.id, type: "in", quantity: product.stock, reason: "Stock inicial" },
    });
  }

  const tables = [
    { number: 1, type: "physical" }, { number: 2, type: "physical" },
    { number: 3, type: "physical" }, { number: 4, type: "physical" },
    { number: 5, type: "physical" }, { number: 6, type: "physical" },
    { number: 1, type: "takeout" },
  ];
  for (const table of tables) {
    await prisma.table.create({ data: table });
  }

  return NextResponse.json({
    message: "✅ Base de datos inicializada correctamente",
    credentials: { email: "admin@cafeteria.com", password: "admin123" },
  });
}
