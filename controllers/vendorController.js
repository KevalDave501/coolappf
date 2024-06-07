// vendorController.js
const fs = require('fs');
const csvParser = require('csv-parser');
const db = require('../db/db');
const path = require('path');
const socket = require('../socket');
const CSV_DIRECTORY = './vendors/';

const getVendors = () => {
  return fs.readdirSync(CSV_DIRECTORY).map(folderName => {
    const filePath = path.join(CSV_DIRECTORY, folderName, `${folderName}.csv`);
    if (fs.existsSync(filePath)) {
      return { folderName, vendorName: folderName };
    }
    return null;
  }).filter(Boolean);
};

const insertProduct = async (productData, vendorName) => {
  const { p_name, p_quantity, p_price } = productData;
  const query = `
      INSERT INTO products (p_name, p_quantity, p_price, vendor_name) 
      SELECT ?, ?, ?, ? 
      FROM dual 
      WHERE NOT EXISTS (
          SELECT 1 
          FROM products 
          WHERE p_name = ? AND p_quantity = ? AND p_price = ? AND vendor_name = ?
      )
  `;
  const values = [p_name, p_quantity, p_price, vendorName, p_name, p_quantity, p_price, vendorName];
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.affectedRows > 0) {
          resolve({
            status: 'insert',
            message: 'Record inserted',
            productName: p_name,
            productPrice: p_price,
            productQuantity: p_quantity
          });
        } else {
          resolve({ status: 'skip', message: 'Record already exists' });
        }
      }
    });
  });
};

const importCSVToDB = async (vendorName) => {
  const filePath = `${CSV_DIRECTORY}${vendorName}/${vendorName}.csv`;
  const io = socket.getIO();

  try {
    const results = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    for (const row of results) {
      try {
        const result = await insertProduct(row, vendorName);
        io.emit('log', result); // Send log to clients
      } catch (err) {
        io.emit('log', { status: 'fail', message: 'Error inserting record' });
      }
    }
  } catch (error) {
    io.emit('log', { status: 'error', message: 'Error importing CSV to DB' });
    throw error;
  }
};

module.exports = { getVendors, importCSVToDB };
