// import express from 'express';
// import mongoose from 'mongoose';
import mongoose from 'mongoose';
import OrdersModal from '../models/orders.js';
import ProductsModal from '../models/products.js';
import store from '../models/store.js';
import UsersModal from '../models/users.js';
import ProductsStatsModal from '../models/productsStats.js';
import moment from 'moment';

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

const updateProductsStats = (products) => {
  let bulkOptions = products.orderItems.map((item) => {
    return {
      updateOne: {
        filter: { product: item.product._id },
        update: { $inc: { available: -item.quantity, sold: +item.quantity, sales: +item.paidPrice } },
      },
    };
  });

  ProductsStatsModal.bulkWrite(bulkOptions);
};

export const getOrders = async (req, res) => {
  try {
    const user = await UsersModal.findOne({ _id: req.userId });
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.per_page) || 10;

    const startIndex = (page - 1) * perPage;
    const total = await OrdersModal.countDocuments({});

    const query = JSON.parse(req.query.query);

    let ordersModals;

    const filters = {};

    if (query.created_at_gteq !== '' && query.created_at_lteq !== '') {
      filters.createdAt = {
        $gte: `${query.created_at_gteq}T00:00:00.000Z`,
        $lt: `${query.created_at_lteq}T23:59:59.999Z`,
      };
    }

    if (query.cashier_id_eq !== '') {
      filters.cashier = query.cashier_id_eq;
    }

    if (query.salesman_id_eq !== '') {
      filters.salesman = query.salesman_id_eq;
    }

    if (query.status_in !== '') {
      filters.status = query.status_in;
    }

    if (user && user.role === 'superAdmin') {
      ordersModals = await OrdersModal.find()
        .where(filters)
        .populate('cashier')
        .populate('salesman')
        .populate('orderItems.product')
        .limit(perPage)
        .skip(startIndex)
        .sort({ createdAt: -1 });
    } else if (user && user.role === 'admin') {
      ordersModals = await OrdersModal.find({
        store: user.store,
      })
        .where(filters)
        .populate('cashier')
        .populate('salesman')
        .populate('orderItems.product')
        .limit(perPage)
        .skip(startIndex)
        .sort({ createdAt: -1 });
    } else {
      return res.status(400).json({ message: 'You are not allowed to access orders' });
    }
    res.status(200).json({ orders: ordersModals, currentPage: page, totalPages: Math.ceil(total / perPage) });
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
      updateProductsStats(newOrderModal);
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

  let bulkOptions = order.orderItems.map((item) => {
    let quantity;
    if (item.delete) {
      quantity = +item.quantity;
    } else if (!item?.previousQuantity) {
      quantity = -item.quantity;
    } else {
      quantity =
        item.quantity > item.previousQuantity
          ? -(item.quantity - item.previousQuantity)
          : +(item.previousQuantity - item.quantity);
    }

    return {
      updateOne: {
        filter: { _id: item.product },
        update: {
          $inc: {
            quantity: quantity,
          },
        },
      },
    };
  });

  const statsBulkOptions = order.orderItems.map((item) => {
    let quantity;
    let sold;
    let sales;
    if (item.delete) {
      quantity = +item.previousQuantity;
      sold = -item.previousQuantity;
      sales = -item.previousPaid;
    } else if (!item?.previousQuantity) {
      quantity = -item.quantity;
      sold = +item.quantity;
      sales = +item.paidPrice;
    } else {
      quantity =
        item.quantity > item.previousQuantity
          ? -(item.quantity - item.previousQuantity)
          : +(item.previousQuantity - item.quantity);
      sold =
        item.quantity > item.previousQuantity
          ? +(item.quantity - item.previousQuantity)
          : -(item.previousQuantity - item.quantity);

      sales =
        item.paidPrice > item.previousPaid
          ? +(item.paidPrice - item.previousPaid)
          : -(item.previousPaid - item.paidPrice);
    }

    return {
      updateOne: {
        filter: { product: item.product },
        update: {
          $inc: {
            available: Number(quantity),
            sold: Number(sold),
            sales: Number(sales),
          },
        },
      },
    };
  });

  const filteredItems = order.orderItems.filter((e) => !e.delete);

  const updatedOrder = { ...order, orderItems: filteredItems, _id: id };

  try {
    await OrdersModal.findByIdAndUpdate(id, updatedOrder, { new: true });
    ProductsModal.bulkWrite(bulkOptions);
    ProductsStatsModal.bulkWrite(statsBulkOptions);
  } catch (error) {
    console.log(error);
  }

  res.json(updatedOrder);
};

export const getOnHoldOrders = async (req, res) => {
  const user = await UsersModal.findOne({ _id: req.userId });

  let onHoldOrders;

  if (user.role === 'superAdmin') {
    onHoldOrders = await OrdersModal.find({ status: 'onHold' })
      .populate('cashier')
      .populate('salesman')
      .populate('orderItems.product')
      .sort({ createdAt: -1 });
  } else {
    onHoldOrders = await OrdersModal.find({ status: 'onHold', store: user.store })
      .populate('cashier')
      .populate('salesman')
      .populate('orderItems.product')
      .sort({ createdAt: -1 });
  }

  res.status(200).json(onHoldOrders);
};
