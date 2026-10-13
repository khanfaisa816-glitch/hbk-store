const router = require('express').Router();
const validate = require('../middleware/validate');
const { authRequired } = require('../middleware/auth');
const { schemas } = require('../validators');
const c = require('../controllers/orderController');

router.use(authRequired); // every order route needs a logged-in customer

router.post('/', validate(schemas.createOrder), c.create);
router.get('/', c.mine);
router.get('/:id', c.getMine);
router.post('/:id/cancel', c.cancelMine);

module.exports = router;
