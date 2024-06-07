// routes/index.js
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/vendors', (req, res) => {
  const vendors = vendorController.getVendors();
  res.json(vendors);
});

router.post('/vendors/import', async (req, res) => {
  try {
    const { vendorName } = req.body;
    await vendorController.importCSVToDB(vendorName);
    res.send('CSV data imported successfully');
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).send('Error importing CSV data');
  }
});

module.exports = router;
