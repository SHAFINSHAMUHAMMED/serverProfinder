import mongoose  from "mongoose";

const locationSchema = new mongoose.Schema(
    {
        location:{
            type:Object,
        }
    },
    )
    const locationModel = mongoose.model('location',locationSchema)
    
    export default  locationModel