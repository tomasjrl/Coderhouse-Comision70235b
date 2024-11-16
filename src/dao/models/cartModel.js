import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    products: [productSchema],
  },
  { versionKey: false }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
