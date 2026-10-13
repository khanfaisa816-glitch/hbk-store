const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const c = require('../controllers/wishlistController');

router.use(authRequired);

router.get('/', c.list);
router.post('/:productId', c.add);
router.delete('/:productId', c.remove);

module.exports = router;
