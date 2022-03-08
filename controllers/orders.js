// import express from 'express';
// import mongoose from 'mongoose';
import mongoose from 'mongoose';
import OrdersModal from '../models/orders.js';
import ProductsModal from '../models/products.js';
import store from '../models/store.js';
import UsersModal from '../models/users.js';

const decreaseQuantity = (products) => {
  let bulkOptions = products.orderItems.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.quantity } },
      },
    };
  });

  ProductsModal.bulkWrite(bulkOptions);
};

export const getOrders = async (req, res) => {
  try {
    const user = await UsersModal.findOne({ _id: req.userId });

    let ordersModals;

    if (user && user.role === 'superAdmin') {
      ordersModals = await OrdersModal.find().populate('cashier').populate('salesman').populate('orderItems.product');
    } else if (user && user.role === 'admin') {
      ordersModals = await OrdersModal.find({ store: user.store })
        .populate('cashier')
        .populate('salesman')
        .populate('orderItems.product');
    } else {
      return res.status(400).json({ message: 'You are not allowed to access orders' });
    }
    res.status(200).json(ordersModals);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  const order = req.body;

  const user = await UsersModal.findOne({ _id: req.userId });

  const newOrderModal = new OrdersModal({
    ...order,
    store: user?.store ? user.store : 'undefined',
    cashier: req?.userId,
    createdAt: new Date().toISOString(),
  });
  try {
    await newOrderModal.save().then((t) => {
      decreaseQuantity(newOrderModal);
      return t.populate('cashier').populate('salesman').populate('orderItems.product').execPopulate();
    });

    res.status(201).json(newOrderModal);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const order = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No order with id: ${id}`);

  const updatedOrder = { ...order, _id: id };

  await OrdersModal.findByIdAndUpdate(id, updatedOrder, { new: true });

  res.json(updatedOrder);
};
