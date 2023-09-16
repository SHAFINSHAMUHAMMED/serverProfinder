import mongoose  from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            lowercase: true,
            unique: true
        },
        password: {
            type: String,
            
        },
        profit: {
            type:Number,
            default:0
        },
        kyc: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "users",
                  },
                  proId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "professionals",   
                  },
                  role: {
                    type:String,
                  },
                  verified: {
                    type: Boolean,
                    default:false
                  },
                  image: {
                    type:String
                  },
                  name: {
                    type: String
                  },
                  email: {
                    type: String
                  },
            }
        ],
    },
    )
    const adminModel = mongoose.model('admin',adminSchema)
    
    export default  adminModel