require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const initializeDatabase = require('./db/init');
const vehiclesRouter = require('./routes/vehicles');
const itemsRouter = require('./routes/items');
const billsRouter = require('./routes/bills');
const businessProfileRouter = require('./routes/businessProfile');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const { authenticateToken } = require('./middleware/auth');

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Lazy initialize database for serverless environments
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  }
  next();
});


app.use('/api/auth', authRouter);

// Apply authentication middleware to all other API routes
app.use('/api', authenticateToken);

app.use('/api/users', usersRouter);
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

if (require.main === module) {
  (async () => {
    try {
      // In local mode, initialize DB immediately before listening
      if (!dbInitialized) {
        await initializeDatabase();
        dbInitialized = true;
      }
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;
