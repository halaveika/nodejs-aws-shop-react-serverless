import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { products } from '../mocks/products';
import dbconfig from '../config/pg-config';

dotenv.config()

const pool = new Pool(dbconfig);

async function createTablesAndInsertData() {
  const client = await pool.connect();

  try {
      const createProductsTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price INT
      )
    `;
    await client.query(createProductsTableQuery);

    const createStocksTableQuery = `
      CREATE TABLE IF NOT EXISTS stocks (
        product_id UUID REFERENCES products(id),
        count INT,
        CONSTRAINT stocks_pk PRIMARY KEY (product_id)
      )
    `;
    await client.query(createStocksTableQuery);

        for (const product of products) {
      const insertProductQuery = `
        INSERT INTO products (id, title, description, price)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(insertProductQuery, [
        product.id,
        product.title,
        product.description,
        product.price,
      ]);
    }

    const stocks = [
      {
        product_id: products[0].id,
        count: 10,
      },
      {
        product_id: products[1].id,
        count: 5,
      },
      {
        product_id: products[2].id,
        count: 8,
      },
      {
        product_id: products[3].id,
        count: 2,
      },
      {
        product_id: products[4].id,
        count: 4,
      },
      {
        product_id: products[5].id,
        count: 16,
      },
    ];

    for (const stock of stocks) {
      const insertStockQuery = `
        INSERT INTO stocks (product_id, count)
        VALUES ($1, $2)
      `;
      await client.query(insertStockQuery, [stock.product_id, stock.count]);
    }

    console.log('Data insertion completed.');
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createTablesAndInsertData().catch((error) =>
  console.error('Error occurred:', error)
);
