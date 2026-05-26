import { seedDatabase } from "./db-seed";

async function main() {
  console.log("Starting standalone database seeding...");
  try {
    await seedDatabase();
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Database seeding failed:", err);
    process.exit(1);
  }
}

main();
