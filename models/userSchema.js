import mongoose  from "mongoose";

const userSchema = new mongoose.Schema(
    {
        // _id :{
        //     type:mongoose.Schema.Types.ObjectId,
        //     default: new mongoose.Types.ObjectId(),
        // },
        name: { 
            type: String,
            required: true,
            uppercase: true,

        }, 
        image: {
            type: String
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true
        },
        phone: {
            type:Number,
            unique: true
        },
        password: {
            type: String,
            minlength: [6],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        googleLogin: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        joinedOn: {
            type:Date
        },
        wallet: {
              type: Number,
              default: 0,
          }, 
        orders: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "orders",
            },
          ],


    },
)
const userModel = mongoose.model('users',userSchema)

export default  userModel