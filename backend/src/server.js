require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[Nirantar Backend v3] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[REST API Root] http://localhost:${PORT}/api/v1`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
    server.close(() => process.exit(1));
  });
});
