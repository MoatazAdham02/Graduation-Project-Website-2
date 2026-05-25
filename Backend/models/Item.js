import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
