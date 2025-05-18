// ==== File: backend/server.js ====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path'); // <--- ИСПРАВИТЬ ОПЕЧАТКУ ЗДЕСЬ
const fileUpload = require('express-fileupload');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'blob:'],
      },
    },
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: 'Файл слишком большой (макс. 5MB)'
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/courses', courseRoutes);

app.use(errorHandler);

const PORT = config.port || 5000; // Используем переменную PORT из config

// Start server only if this file is run directly (not required by another module like tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Экспортируем app для тестов