const router = require('express').Router();
const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const { schemas } = require('../validators');
const c = require('../controllers/discountController');

router.post('/validate', authRequired, validate(schemas.discountCheck), c.check);

module.exports = router;
