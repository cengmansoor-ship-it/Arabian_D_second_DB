import { Sequelize, type Dialect } from "sequelize";
import path from "node:path";

/**
 * Central Sequelize connection. Defaults to local SQLite (offline-first).
 * Set DB_DIALECT=mysql plus DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD to
 * switch to a hosted MySQL database without any code changes elsewhere.
 */
function createConnection(): Sequelize {
  const dialect = (process.env["DB_DIALECT"] as Dialect) || "sqlite";

  if (dialect === "mysql") {
    return new Sequelize(
      process.env["DB_NAME"] || "arabian_d",
      process.env["DB_USER"] || "root",
      process.env["DB_PASSWORD"] || "",
      {
        host: process.env["DB_HOST"] || "localhost",
        port: process.env["DB_PORT"] ? Number(process.env["DB_PORT"]) : 3306,
        dialect: "mysql",
        logging: false,
      },
    );
  }

  const storage =
    process.env["SQLITE_STORAGE"] ||
    path.join(process.cwd(), "data", "arabian-d.sqlite");

  return new Sequelize({
    dialect: "sqlite",
    storage,
    logging: false,
  });
}

export const sequelize: Sequelize = createConnection();
