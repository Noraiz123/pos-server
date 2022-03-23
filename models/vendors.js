import mongoose from 'mongoose';

const categoriesSchema = mongoose.Schema({
  name: { type: String, required: true },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  description: String,
});

export default mongoose.model('Vendors', categoriesSchema);
