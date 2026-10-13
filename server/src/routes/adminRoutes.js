const router = require('express').Router();
const validate = require('../middleware/validate');
const { adminRequired } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { schemas } = require('../validators');

const admin = require('../controllers/adminController');
const products = require('../controllers/productController');
const categories = require('../controllers/categoryController');
const orders = require('../controllers/orderController');
const discounts = require('../controllers/discountController');
const store = require('../controllers/storeController');

router.use(adminRequired); // everything below is admin only

// Dashboard & reports
router.get('/stats', admin.stats);
router.get('/reports/sales', validate(schemas.salesReportQuery, 'query'), admin.salesReport);

// Products (create/update accept multipart form data so an image can be uploaded)
router.get('/products', validate(schemas.productsQuery, 'query'), products.adminList);
router.post('/products', upload.single('image'), products.create);
router.put('/products/:id', upload.single('image'), products.update);
router.delete('/products/:id', products.remove);

// Categories
router.get('/categories', categories.adminList);
router.post('/categories', validate(schemas.category), categories.create);
router.put('/categories/:id', validate(schemas.category), categories.update);
router.delete('/categories/:id', categories.remove);

// Orders
router.get('/orders', validate(schemas.ordersQuery, 'query'), orders.adminList);
router.get('/orders/:id', orders.adminGet);
router.put('/orders/:id/status', validate(schemas.orderStatus), orders.adminSetStatus);

// Customers
router.get('/customers', validate(schemas.customersQuery, 'query'), admin.customers);
router.put('/customers/:id/status', validate(schemas.customerStatus), admin.setCustomerStatus);

// Discount codes
router.get('/discounts', discounts.adminList);
router.post('/discounts', validate(schemas.discount), discounts.create);
router.put('/discounts/:id', validate(schemas.discount), discounts.update);
router.delete('/discounts/:id', discounts.remove);

// Promo banners
router.get('/offers', store.offerList);
router.post('/offers', validate(schemas.offer), store.offerCreate);
router.put('/offers/:id', validate(schemas.offer), store.offerUpdate);
router.delete('/offers/:id', store.offerRemove);

// Contact form messages
router.get('/messages', store.messageList);
router.delete('/messages/:id', store.messageRemove);

module.exports = router;
