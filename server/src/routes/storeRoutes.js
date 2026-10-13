const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { schemas } = require('../validators');
const c = require('../controllers/storeController');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});

router.get('/store', c.info);
router.post('/contact', contactLimiter, validate(schemas.contact), c.contact);

module.exports = router;
