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
        }
    },
    )
    const adminModel = mongoose.model('admin',adminSchema)
    
    export default  adminModel