require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initializeDatabase = require('./db/init');
const vehiclesRouter = require('./routes/vehicles');
const itemsRouter = require('./routes/items');
const billsRouter = require('./routes/bills');
const businessProfileRouter = require('./routes/businessProfile');
const categoriesRouter = require('./routes/categories');

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/business-profile', businessProfileRouter);
app.use('/api/categories', categoriesRouter);

app.get('/', (req, res) => res.json({ message: 'Vehicle Management System API' }));

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

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
