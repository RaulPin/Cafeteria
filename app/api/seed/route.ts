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
    { name: "Bebidas Frías", color: "#1D4ED8" },
    { name: "Bebidas Calientes", color: "#92400E" },
    { name: "Desayunos", color: "#DC2626" },
    { name: "Comidas", color: "#166534" },
    { name: "Postres", color: "#DB2777" },
    { name: "Extras", color: "#7C3AED" },
  ];

  const createdCats: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    createdCats[cat.name] = created.id;
  }

  const products = [
    // Bebidas Frías
    { name: "Latte Frío", price: 75, categoryId: createdCats["Bebidas Frías"], stock: 100, minStock: 10, unit: "pieza" },
    { name: "Caramel Latte Frío", price: 80, categoryId: createdCats["Bebidas Frías"], stock: 100, minStock: 10, unit: "pieza" },
    { name: "Moka Oscuro Frío", price: 80, categoryId: createdCats["Bebidas Frías"], stock: 100, minStock: 10, unit: "pieza" },
    { name: "Espresso Tonic", price: 75, categoryId: createdCats["Bebidas Frías"], stock: 100, minStock: 10, unit: "pieza" },
    { name: "Americano/Long Black Frío", price: 55, categoryId: createdCats["Bebidas Frías"], stock: 100, minStock: 10, unit: "pieza" },
    { name: "Soda Italiana", price: 60, categoryId: createdCats["Bebidas Frías"], stock: 80, minStock: 10, unit: "pieza" },
    { name: "Chocolate Frío", price: 70, categoryId: createdCats["Bebidas Frías"], stock: 80, minStock: 10, unit: "pieza" },
    { name: "Taro Frío", price: 70, categoryId: createdCats["Bebidas Frías"], stock: 80, minStock: 10, unit: "pieza" },
    { name: "Matcha Frío", price: 70, categoryId: createdCats["Bebidas Frías"], stock: 80, minStock: 10, unit: "pieza" },

    // Bebidas Calientes
    { name: "Espresso", price: 30, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Espresso Macchiato", price: 45, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Cortado", price: 50, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Americano/Long Black Caliente", price: 55, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Cappuccino", price: 65, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Flat White", price: 65, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Matcha Caliente", price: 65, categoryId: createdCats["Bebidas Calientes"], stock: 80, minStock: 10, unit: "pieza" },
    { name: "Taro Caliente", price: 65, categoryId: createdCats["Bebidas Calientes"], stock: 80, minStock: 10, unit: "pieza" },
    { name: "Latte Caliente", price: 70, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Moka Oscuro Caliente", price: 75, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Caramel Latte Caliente", price: 75, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Salted Caramel", price: 75, categoryId: createdCats["Bebidas Calientes"], stock: 100, minStock: 15, unit: "pieza" },
    { name: "Chocolate Caliente", price: 65, categoryId: createdCats["Bebidas Calientes"], stock: 80, minStock: 10, unit: "pieza" },

    // Desayunos
    { name: "French Toast", price: 78, categoryId: createdCats["Desayunos"], stock: 30, minStock: 5, unit: "pieza" },
    { name: "Waffles Sencillos", price: 75, categoryId: createdCats["Desayunos"], stock: 30, minStock: 5, unit: "pieza" },
    { name: "Waffles con Toppings", price: 90, categoryId: createdCats["Desayunos"], stock: 30, minStock: 5, unit: "pieza" },
    { name: "Croque Madame", price: 120, categoryId: createdCats["Desayunos"], stock: 20, minStock: 3, unit: "pieza" },
    { name: "Crepas", price: 75, categoryId: createdCats["Desayunos"], stock: 25, minStock: 5, unit: "pieza" },
    { name: "Croissant Salado (Desayuno)", price: 90, categoryId: createdCats["Desayunos"], stock: 20, minStock: 5, unit: "pieza" },

    // Comidas
    { name: "Sandwich Clásico", price: 80, categoryId: createdCats["Comidas"], stock: 20, minStock: 3, unit: "pieza" },
    { name: "Croissant Salado", price: 90, categoryId: createdCats["Comidas"], stock: 20, minStock: 3, unit: "pieza" },
    { name: "Croque Monsieur", price: 115, categoryId: createdCats["Comidas"], stock: 15, minStock: 3, unit: "pieza" },

    // Postres
    { name: "Galletas Estilo NY", price: 55, categoryId: createdCats["Postres"], stock: 30, minStock: 5, unit: "pieza" },
    { name: "Brownies Nevados", price: 65, categoryId: createdCats["Postres"], stock: 25, minStock: 5, unit: "pieza" },
    { name: "Muffin de Plátano con Chispas", price: 20, categoryId: createdCats["Postres"], stock: 25, minStock: 5, unit: "pieza" },
    { name: "Croissant de Fresas con Crema", price: 70, categoryId: createdCats["Postres"], stock: 20, minStock: 3, unit: "pieza" },
    { name: "Conchas de Masa Madre", price: 25, categoryId: createdCats["Postres"], stock: 20, minStock: 5, unit: "pieza" },
    { name: "Ladies de Cajeta / Ate-Queso Crema", price: 20, categoryId: createdCats["Postres"], stock: 20, minStock: 5, unit: "pieza" },
    { name: "Roles de Canela", price: 50, categoryId: createdCats["Postres"], stock: 15, minStock: 3, unit: "pieza" },
    { name: "Pay de Queso", price: 80, categoryId: createdCats["Postres"], stock: 15, minStock: 3, unit: "pieza" },

    // Extras
    { name: "Extra Vainilla", price: 15, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Extra Avellana", price: 15, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Extra Crema de Maní (PB)", price: 15, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Extra Jarabe Frutal", price: 15, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Extra Chocolate", price: 20, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Extra Caramelo", price: 20, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Leche de Avena", price: 15, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
    { name: "Extra Espresso", price: 30, categoryId: createdCats["Extras"], stock: 100, minStock: 20, unit: "pieza" },
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

  const ingredients = [
    // Lácteos
    { name: "Leche entera", category: "Lácteos", stock: 10, minStock: 3, unit: "litro" },
    { name: "Leche descremada", category: "Lácteos", stock: 5, minStock: 2, unit: "litro" },
    { name: "Leche de avena", category: "Lácteos", stock: 6, minStock: 2, unit: "litro" },
    { name: "Leche de almendra", category: "Lácteos", stock: 4, minStock: 1, unit: "litro" },
    { name: "Crema para batir", category: "Lácteos", stock: 2, minStock: 1, unit: "litro" },
    { name: "Leche condensada", category: "Lácteos", stock: 3, minStock: 1, unit: "lata" },
    // Café
    { name: "Café espresso (grano)", category: "Café", stock: 3, minStock: 1, unit: "kg" },
    { name: "Café molido", category: "Café", stock: 2, minStock: 0.5, unit: "kg" },
    // Jarabes
    { name: "Jarabe de vainilla", category: "Jarabes", stock: 2, minStock: 0.5, unit: "botella" },
    { name: "Jarabe de avellana", category: "Jarabes", stock: 2, minStock: 0.5, unit: "botella" },
    { name: "Jarabe de caramelo", category: "Jarabes", stock: 2, minStock: 0.5, unit: "botella" },
    { name: "Jarabe frutal", category: "Jarabes", stock: 3, minStock: 1, unit: "botella" },
    { name: "Chocolate en polvo", category: "Jarabes", stock: 1, minStock: 0.25, unit: "kg" },
    { name: "Matcha en polvo", category: "Jarabes", stock: 0.5, minStock: 0.1, unit: "kg" },
    { name: "Taro en polvo", category: "Jarabes", stock: 0.5, minStock: 0.1, unit: "kg" },
    { name: "Crema de maní (PB)", category: "Jarabes", stock: 2, minStock: 0.5, unit: "kg" },
    // Frutas
    { name: "Limón", category: "Frutas", stock: 20, minStock: 5, unit: "pieza" },
    { name: "Fresa", category: "Frutas", stock: 1, minStock: 0.25, unit: "kg" },
    { name: "Mango", category: "Frutas", stock: 1, minStock: 0.25, unit: "kg" },
    { name: "Blueberry", category: "Frutas", stock: 0.5, minStock: 0.1, unit: "kg" },
    { name: "Plátano", category: "Frutas", stock: 10, minStock: 3, unit: "pieza" },
    // Panadería
    { name: "Pan para sandwich", category: "Panadería", stock: 20, minStock: 5, unit: "pieza" },
    { name: "Croissant", category: "Panadería", stock: 15, minStock: 5, unit: "pieza" },
    { name: "Harina", category: "Panadería", stock: 5, minStock: 1, unit: "kg" },
    { name: "Huevo", category: "Panadería", stock: 30, minStock: 10, unit: "pieza" },
    { name: "Mantequilla", category: "Panadería", stock: 1, minStock: 0.25, unit: "kg" },
    { name: "Azúcar", category: "Panadería", stock: 3, minStock: 0.5, unit: "kg" },
    // Bebidas base
    { name: "Agua mineral/tónica", category: "Bebidas base", stock: 24, minStock: 6, unit: "pieza" },
    { name: "Chocolate oscuro", category: "Bebidas base", stock: 1, minStock: 0.25, unit: "kg" },
  ];

  for (const ingredient of ingredients) {
    const created = await prisma.ingredient.create({ data: ingredient });
    await prisma.ingredientMovement.create({
      data: { ingredientId: created.id, type: "in", quantity: ingredient.stock, reason: "Stock inicial" },
    });
  }

  return NextResponse.json({
    message: "✅ Base de datos de Taza Mia inicializada correctamente",
    credentials: { email: "admin@cafeteria.com", password: "admin123" },
    productos: products.length,
    insumos: ingredients.length,
  });
}
