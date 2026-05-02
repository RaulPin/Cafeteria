import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@cafeteria.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@cafeteria.com",
      password: hashedPassword,
      role: "admin",
    },
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
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
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
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (!existing) {
      const created = await prisma.product.create({ data: product });
      await prisma.inventoryMovement.create({
        data: { productId: created.id, type: "in", quantity: product.stock, reason: "Stock inicial" },
      });
    }
  }

  const tables = [
    { number: 1, type: "physical" },
    { number: 2, type: "physical" },
    { number: 3, type: "physical" },
    { number: 4, type: "physical" },
    { number: 5, type: "physical" },
    { number: 6, type: "physical" },
    { number: 1, type: "takeout" },
  ];

  for (const table of tables) {
    const existing = await prisma.table.findFirst({ where: { number: table.number, type: table.type } });
    if (!existing) {
      await prisma.table.create({ data: table });
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log("📧 Login: admin@cafeteria.com");
  console.log("🔑 Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
