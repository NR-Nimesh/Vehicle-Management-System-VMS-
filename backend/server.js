require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initializeDatabase = require('./db/init');
const vehiclesRouter = require('./routes/vehicles');
const itemsRouter = require('./routes/items');
const billsRouter = require('./routes/bills');
const businessProfileRouter = require('./routes/businessProfile');

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/business-profile', businessProfileRouter);

app.get('/', (req, res) => res.json({ message: 'Vehicle Management System API' }));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
