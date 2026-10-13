const router = require('express').Router();
const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const { schemas } = require('../validators');
const c = require('../controllers/productController');

router.get('/', validate(schemas.productsQuery, 'query'), c.list);
router.get('/:idOrSlug', c.get);
router.post('/:idOrSlug/reviews', authRequired, validate(schemas.review), c.addReview);

module.exports = router;
