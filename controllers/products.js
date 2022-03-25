import express from 'express';
import mongoose from 'mongoose';
import ProductsModal from '../models/products.js';
import UsersModal from '../models/users.js';
import ProductsStatsModal from '../models/productsStats.js';

const router = express.Router();

const updateProductsStats = (id, quantity) => {
  let bulkOptions = [
    {
      updateOne: {
        filter: { product: id },
        update: { $inc: { available: quantity } },
      },
    },
  ];

  ProductsStatsModal.bulkWrite(bulkOptions);
};

export const getProducts = async (req, res) => {
  try {
    const query = {};
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.per_page) || 10;

    const startIndex = (page - 1) * perPage;
    const total = await ProductsModal.countDocuments({});

    query.$or = [
      {
        name: { $regex: req.query.search_keyword || '', $options: 'i' },
      },
    ];
    const user = await UsersModal.findOne({ _id: req.userId });

    let productsModals;

    if (user && user.role === 'superAdmin') {
      productsModals = await ProductsModal.find(query)
        .populate('category')
        .populate('store')
        .limit(perPage)
        .skip(startIndex);
    } else {
      productsModals = await ProductsModal.find({ store: user.store, ...query })
        .populate('store')
        .populate('category')
        .limit(perPage)
        .skip(startIndex);
    }
    res.status(200).json({ products: productsModals, currentPage: page, totalPages: Math.ceil(total / perPage) });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await ProductsModal.findById(id).populate('store');

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const randomBarCode = () => {
  let val1 = Math.floor(100000 + Math.random() * 999999);
  let val2 = Math.floor(10000 + Math.random() * 99999);

  return '7' + val1 + val2;
};

export const createProduct = async (req, res) => {
  const product = req.body;

  const user = await UsersModal.findOne({ _id: req.userId });
  const barCode = randomBarCode();

  const newProductsModal = new ProductsModal({
    ...product,
    barcode: product.barcode !== '' ? product.barcode : barCode,
    store: product?.store ? product.store : user.store,
    createdAt: new Date().toISOString(),
  });

  try {
    await newProductsModal.save();

    const createProductsStats = new ProductsStatsModal({
      product: newProductsModal._id,
      store: newProductsModal.store,
      available: newProductsModal.quantity,
      sold: 0,
      sales: 0,
    });
    await createProductsStats.save();

    res.status(201).json(newProductsModal);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const products = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No product with id: ${id}`);
  const product = await ProductsModal.findOne({ _id: id });

  const updatedProduct = { ...products, _id: id };

  if (product.quantity !== products.quantity) {
    const quantity =
      Number(products.quantity) > Number(product.quantity)
        ? +(products.quantity - product.quantity)
        : -(product.quantity - products.quantity);
    updateProductsStats(id, quantity);
  }
  try {
    const update = await ProductsModal.findByIdAndUpdate(id, updatedProduct, { new: true, runValidators: true })
      .populate('store')
      .populate('category');

    res.json(update);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No product with id: ${id}`);

  await ProductsModal.findByIdAndRemove(id);
  await ProductsStatsModal.findOneAndDelete({ product: id });

  res.json({ message: 'Product deleted successfully.' });
};

export default router;
