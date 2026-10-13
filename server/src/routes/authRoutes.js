const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const { schemas } = require('../validators');
const c = require('../controllers/authController');

// Slows down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/register', authLimiter, validate(schemas.register), c.register);
router.post('/login', authLimiter, validate(schemas.login), c.login);
router.post('/admin/login', authLimiter, validate(schemas.login), c.adminLogin);

router.get('/me', authRequired, c.me);
router.put('/me', authRequired, validate(schemas.profile), c.updateMe);
router.put('/password', authRequired, validate(schemas.changePassword), c.changePassword);

module.exports = router;
