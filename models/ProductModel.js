import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  _id: { 
    type: String,
  },
  name: { 
    type: String, 
    required: true 
  },
   slug: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String 
  }, 
  subCategory: { 
    type: String 
  }, 
  discount: { 
    type: Number 
  }, 
  sold: { 
    type: Number,
    default: 0
  }, 
  rating: { 
     type: Number,
    default: 0
  }, 
  reviews: { 
     type: Number,
    default: 0
  },
  brand: { 
    type: String 
  }, 
  description: { 
    type: String 
  }, 
  specifications: { 
    type: Object 
  },
  featured: { type: Boolean, default: false },
  images:{
    type: Array
  },
  stock: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Product', productSchema);