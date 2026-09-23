const express = require('express');
const { body } = require('express-validator');
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getCategories } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/categories', getCategories);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post('/', authorize('admin', 'supplier'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], createProduct);

router.put('/:id', authorize('admin', 'supplier'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
