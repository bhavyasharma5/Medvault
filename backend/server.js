const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const documentsRouter = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/documents', documentsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏥 Patient Document Portal - Backend API                ║
║                                                           ║
║   Server running at: http://localhost:${PORT}               ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST   /documents/upload  - Upload a PDF              ║
║   • GET    /documents         - List all documents        ║
║   • GET    /documents/:id     - Download a document       ║
║   • DELETE /documents/:id     - Delete a document         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
