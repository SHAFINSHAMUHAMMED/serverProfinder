import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(

    {
        userID: {
            type:mongoose.Schema.Types.ObjectId,
            ref:'users',
            type:String
        },
        proId: {
            type:mongoose.Schema.Types.ObjectId,
            ref:'professionals',
            type:String
        },
        orderId: {
            type:String
        },
        date: {
            type:Date
        },
        pro_confirmed:{
            type:Boolean,
            default:false
        },
        work_status: {
            status: {
                type:String,
                default:'pending'
            },
            role:{
                type:String
            },    
        },
        work_type: {
            type: String,
        },
        category: {
            type:String,
        },
        payment: {
            type: Number,
        },
        address: {
            name: {
                type: String,
                uppercase: true,
            },
            location: {
                type: String,
                uppercase:true,
            },
            contact: {
                type: Number
            },
            zip: {
                type: Number
            }
        },
        reviews: {
            date: {
                type:Date
            },
            description: {
                type: String,
            },
            star: {
                type: Number,
                default:0
            }
        }


    }
)
const orderModel = mongoose.model('orders',orderSchema)
    
    export default  orderModel