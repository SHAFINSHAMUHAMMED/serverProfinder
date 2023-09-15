import orderSchema from "../models/orderSchema.js";
import transactionSchema from "../models/transactionSchema.js";
import userModel from "../models/userSchema.js";
import professionalsModel from "../models/professionalSchema.js";
import env from "dotenv";
env.config();
import Razorpay from "razorpay";
import crypto from "crypto";
import { read } from "fs";
import { log } from "console";
import adminModel from "../models/adminSchema.js";

export const getBookings = async (req, res) => {
  const proId = req.query.proId;
  const userId = req.query.userId;
  const selectedDate = new Date(req.query.selectedDate);

  try {
    if (proId) {
      const orders = await orderSchema
        .find({ proId: proId })
        .populate("userID").sort({date:-1});
      if (orders) {
        const bookingsWithDate = orders.filter((order) => {
          const orderDate = new Date(order.date);
          return (
            orderDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
            orderDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            orderDate.getUTCDate() === selectedDate.getUTCDate()
          );
        });
        if (bookingsWithDate.length > 0) {
          res.status(200).json({ status: true, bookingsWithDate, orders });
        } else {
          res.status(200).json({
            status: false,
            message: "No bookings found for the given date and proId.",
            orders,
          });
        }
      } else {
        res.status(500).json({ status: false, message: "Error" });
      }
    } else if (userId) {
      const orders = await orderSchema
        .find({ userID: userId })
        .populate("proId").sort({date:-1});
      if (orders) {
        res.status(200).json({ status: true, orders });
      } else {
        res.status(200).json({ status: false, message: "No bookings found." });
      }
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching bookings." });
  }
};

//Razorpay
export const razorpay = async (req, res) => {
  try {
    var instance = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_PASS,
    });

    var options = {
      amount: req.body.selectedPayment * 100,
      currency: "INR",
    };

    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({ status: false });
      } else {
        return res.json({ status: true, data: order });
      }
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const verifyrzpay = async (req, res) => {
  const razorpayId = req.body.response.razorpay_order_id;
  const razorpayPaymentId = req.body.response.razorpay_payment_id;
  const { proData, date, time, formData, userId } = req.body.requestData;
  const parsedDate = new Date(date);
  parsedDate.setDate(parsedDate.getDate() + 1);
  parsedDate.setUTCHours(0, 0, 0, 0);
  const newDate = parsedDate.toISOString();
  const body = `${razorpayId}|${razorpayPaymentId}`;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_PASS)
      .update(body, "utf-8")
      .digest("hex");
    if (expectedSignature === req.body.response.razorpay_signature) {
      const orderData = await orderSchema.create({
        userID: userId,
        proId: proData._id,
        orderId: razorpayId.substring(6),
        date: newDate,
        work_type: time, //full/part
        category: proData.category.name,
        payment: formData.selectedPayment,
        address: {
          name: formData.firstName + " " + formData.lastName,
          location:
            formData.city + " " + formData.landmark + " " + formData.district,
          contact: formData.phone,
          zip: formData.zip,
        },
      });
      if(orderData){
        const transaction = await transactionSchema.create({
          PaymentType: 'in',
          To: 'admin',
          Type: 'booking',
          date: new Date(),
          orderId: orderData._id,
          userID:orderData.userID,
          proId:orderData.proId,
        })
      }
    
      res.status(200).json({ status: true, message: "Payment success", orderData });
    } else {
      console.log("invalid signature");
      res.json({ status: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Failed" });
  }
};

//////////cancell Booking////////
export const cancellJob = async (req, res) => {
  const id = req.body.id;
  const role = req.body.Role;
  const payment = req.body.payment;
  try {
    const order = await orderSchema.findOne({ _id: id });
    const cancell = await orderSchema.updateOne(
      { _id: id },
      {
        $set: {
          work_status: {
            status: "cancelled",
            role: role,
          },
        },
      }
    );
    let update = null;

    if (role === "user") {
      if (payment > 100) {
        const create = await transactionSchema.create({
          PaymentType: "in",
          date: new Date(),
          orderId: id,
          To:'user',
          userID:order.userID,
          proId:order.proId,
          Type: "refund",
        });
        update = await userModel.updateOne(
          { _id: order.userID },
          {
            $inc: {
              wallet: payment - 100,
            },
          }
        );
      }
    } else {
      const create = await transactionSchema.create({
        PaymentType: "in",
        date: new Date(),
        orderId: id,
        To: 'user',
        userID:order.userID,
        proId:order.proId,
        Type: "refund",
      });
      update = await userModel.updateOne(
        { _id: order.userID },
        {
          $inc: {
            wallet: payment,
          },
        }
      );
    }

    if (cancell && update) {
      res.status(200).json({ status: true, message: "Cancelled Amount Refunded" });
    } else if (cancell.modifiedCount > 0) {
      res.status(200).json({ status: true, message: "Cancelled" });
    } else {
      res.json({ status: false, message: "some error occured" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ staus: false, message: "Error" });
  }
};

//////////Accept Jobs by Pro/////////
export const acceptJob = async (req, res) => {
  const id = req.body.id;
  try {
    const confirm = await orderSchema.updateOne(
      { _id: id },
      { $set: { pro_confirmed: true } }
    );

    if (confirm.modifiedCount > 0) {
      res.status(200).json({ status: true, message: "job confirmed" });
    } else {
      res.json({ status: false, message: "some error occured" });
    }
  } catch (error) {
    res.status(500).json({ staus: false, message: "Error" });
  }
};

//order conformation otp
export const workCompleted = async (req, res) => {

  const id = req.body.bookingId;
  try {
    const order = await orderSchema.findOne({ _id: id });
    const pro = await professionalsModel.findOne({ _id: order.proId });
    if (order && pro) {
      const confirm = await orderSchema.updateOne(
        { _id: id },
        {
          $set: {
            work_status: {
              status: "completed",
            },
          },
        }
      );
      if (confirm) {
        const update = await professionalsModel.updateOne(
          { _id: order.proId },
          {
            $inc: {
              wallet: order.payment - 50,
            },
          }
        );
        if (update) {
          const create = await transactionSchema.create({
            PaymentType: "in",
            To: 'pro',
            date: new Date(),
            orderId: id,
            Type: "work done",
            userID:order.userID,
            proId:order.proId,
          });
          const update = await adminModel.updateOne(
            {},{
              $inc:{
                profit:50,
              }
            }
          )
        }
      }

      if (confirm.modifiedCount > 0) {
        res.status(200).json({ status: true, message: "job completed" });
      } else {
        res.json({ status: false, message: "some error occured" });
      }
    } else {
      res.json({ status: false, message: "some error occured" });
    }
  } catch (error) {
    res.status(500).json({ staus: false, message: "Error" });
  }
};

export const addReview = async (req, res) => {
  try {
    let oldStar = 0;
    const order = await orderSchema.findOne({ _id: req.body.Id });
    const pro = await professionalsModel.findOne({ _id: req.body.Proid });
    const update = await orderSchema.updateOne(
      { _id: req.body.Id },
      {
        $set: {
          reviews: {
            date: new Date(),
            description: req.body.reviewText,
            star: req.body.rating,
          },
        },
      }
    );
    if (order.reviews.star) {
      let old = order.reviews.star;
      let newStar = req.body.rating;
      let current = newStar - old;
      const rating = await professionalsModel.updateOne(
        { _id: req.body.Proid },
        {
          $set: {
            rating: {
              stars: pro.rating.stars + current,
              TotalReviews: pro.rating.TotalReviews,
            },
          },
        }
      );
    } else {
      const rating = await professionalsModel.updateOne(
        { _id: req.body.Proid },
        {
          $set: {
            rating: {
              stars: pro.rating.stars + req.body.rating,
              TotalReviews: pro.rating.TotalReviews + 1,
            },
          },
        }
      );
    }

    if (update.modifiedCount > 0) {
      res.status(200).json({ status: true, message: "Review Updated" });
    } else {
      res.status(200).json({ status: false, message: "Error occured" });
    }
  } catch (error) {
    res.status(500).json({ staus: false, message: "Error" });
  }
};

export const transactions = async (req,res) => {
  const id = req.query.id
  const role = req.query.role
  try{
    if(role=='user'){
      const trans = await transactionSchema.find({
        userID:id,
        Type: { $ne: 'booking' },
        To: {$eq: 'user'}
      }).populate('orderId').populate('proId')
      if(trans){
        res.status(200).json({status:true, data:trans})
      }else{
        res.status(200).json({status:false})
      }
    }else{
      const trans = await transactionSchema.find({
        proId:id,
        Type: { $ne: 'booking' },
        To: {$eq: 'pro'}
      }).populate('orderId').populate('userID')
      if(trans){
        res.status(200).json({status:true, data:trans})
      }else{
        res.status(200).json({status:false})
      }
    }
  }catch(error){
    
  }
}

export const withdrawReq = async (req,res)=>{
  const formdata = req.body.formData
  const role = req.body.role
  const id = req.body.id
  try{
    let data = null;
    if(role=='user'){
       data = await transactionSchema.create(
        {
        // PaymentType: "out", make out after accept payment
        date: new Date(),
        To: 'user',
        Type: "withdrawal",
        withdrawStatus: 'requested',
        userID: id,
        accDetails:
          {
            accNo: formdata.accountNumber,
            amt: formdata.amount,
            accHolder: formdata.accountHolder,
            bankName: formdata.bankName,
            ifsc:formdata.ifscCode,
            branch: formdata.branch,

          }
        
      }
        )
    }else{
       data = await transactionSchema.create(
        {
        // PaymentType: "out", make out after accept payment
        date: new Date(),
        To: 'pro',
        Type: "withdrawal",
        withdrawStatus: 'requested',
        proId: id,
        accDetails:
          {
            accNo: formdata.accountNumber,
            amt: formdata.amount,
            accHolder: formdata.accountHolder,
            bankName: formdata.bankName,
            ifsc:formdata.ifscCode,
            branch: formdata.branch,

          }
      }
        )
    }
    if(data){
      res.status(200).json({status:true,message:'Withdrawal Requested'})
    }else{
      res.status(200).json({status:false,message:'Error occured'})
    }
  }catch(error){
    console.log(error);
    res.status(500).json({status:false,message:'Error occured'})
  }
}