import express from 'express';
import mongoose from 'mongoose';
import ProductsModal from '../models/products.js';

const router = express.Router();

export const getProducts = async (req, res) => {
  try {
    const productsModals = await ProductsModal.find();
    res.status(200).json(productsModals);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await ProductsModal.findById(id);

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  const product = req.body;

  const newProductsModal = new ProductsModal({ ...product, createdAt: new Date().toISOString() });

  try {
    await newProductsModal.save();

    res.status(201).json(newProductsModal);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const products = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No post with id: ${id}`);

  const updatedProduct = { ...products, _id: id };

  await ProductsModal.findByIdAndUpdate(id, updatedProduct, { new: true });

  res.json(updatedProduct);
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No product with id: ${id}`);

  await ProductsModal.findByIdAndRemove(id);

  res.json({ message: 'Product deleted successfully.' });
};

export default router;
