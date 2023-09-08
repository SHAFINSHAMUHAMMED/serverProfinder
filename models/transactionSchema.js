import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {   
              PaymentType: {  //dr or credit
                type: String,
              },
              withdrawStatus: {
                type:String
              },
              To: {       //save to whome here 
                type: String
              },
              userID: {
                type:mongoose.Schema.Types.ObjectId,
                ref:'users',
            },
              proId: {
                type:mongoose.Schema.Types.ObjectId,
                ref:'professionals',
            },
              Type: {   //reason refund/any
                type: String,
              },
              holder: {    //at withdrawal time there is no orderId so keep user id
                type: String
              },
              date: {
                type: Date,
              },
              orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "orders",
              },
              accDetails: {
                  accNo: {
                    type: Number,
                  },
                  amt: {
                    type:Number
                  },
                  accHolder: {
                    type:String,
                  },
                  bankName: {
                    type:String,
                  },
                  ifsc: {
                    type:String
                  },
                  branch: {
                    type:String
                  },
                },
            },
    )
    const transactionsModel = mongoose.model('transactions',transactionSchema)
    
    export default  transactionsModel