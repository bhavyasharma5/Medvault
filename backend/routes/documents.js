const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with UUID prefix
    const uniquePrefix = uuidv4().split('-')[0];
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniquePrefix}_${sanitizedFilename}`);
  }
});

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /documents/upload - Upload a PDF file
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 10MB limit'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF file.'
      });
    }

    try {
      // Insert file metadata into database
      const result = await db.runAsync(
        'INSERT INTO documents (filename, filepath, filesize) VALUES (?, ?, ?)',
        [req.file.originalname, req.file.filename, req.file.size]
      );

      // Retrieve the inserted document
      const document = await db.getAsync(
        'SELECT * FROM documents WHERE id = ?',
        [result.lastID]
      );

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        document: document
      });
    } catch (error) {
      // If database insert fails, delete the uploaded file
      fs.unlink(req.file.path, () => {});
      console.error('Database error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save file metadata'
      });
    }
  });
});

// GET /documents - List all documents
router.get('/', async (req, res) => {
  try {
    const documents = await db.allAsync(
      'SELECT * FROM documents ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      documents: documents
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
});

// GET /documents/:id - Download a specific file
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find document in database
    const document = await db.getAsync(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const filePath = path.join(uploadsDir, document.filepath);

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
});

// DELETE /documents/:id - Delete a file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find document in database
    const document = await db.getAsync(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const filePath = path.join(uploadsDir, document.filepath);

    // Delete from database first
    await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);

    // Delete file from disk (don't fail if file doesn't exist)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

module.exports = router;
