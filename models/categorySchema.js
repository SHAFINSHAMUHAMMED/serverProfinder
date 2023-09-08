import mongoose  from "mongoose";

const categoryScema = new mongoose.Schema(
    {
        name:{
            type:String,
            trim:true,
            uppercase:true,
        }
    },
    )
    const categoryModel = mongoose.model('category',categoryScema)
    
    export default  categoryModel