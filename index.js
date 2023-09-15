import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import ChatModel from "./models/chatSchema.js";
dotenv.config();

const app = express();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(morgan("dev"));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use(express.static("public"));
app.use(cookieParser());

// Configure specific origins, methods, and headers
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Enable CORS with the custom options
app.use(cors(corsOptions));

import adminRouter from "./routes/admin.js";
import professionalsRouter from "./routes/professionals.js";
import userRouter from "./routes/user.js";

app.use("/admin", adminRouter);
app.use("/professionals", professionalsRouter);
app.use("/", userRouter);

const PORT = 4000;
mongoose
  .connect(process.env.mongo_atlas, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
   console.log('connected')
  })
  .catch((error) => console.log(`${error} did not connect`));

  const server =  app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true, // Fix typo here: Credential -> credentials
    },
  });
  
  io.of("/chat").on("connection", (socket) => {
    socket.on("setup", (chatId) => {
      socket.join(chatId);
    });
    
    socket.on("newMessage", (message, chatId) => {
      io.of("/chat").emit("messageResponse", message, chatId);
      addMessage(chatId, message);
    });
    
    socket.on("read", (chatId, storeId) => {
      markMessagesAsRead(chatId, storeId);
      io.of("/chat").emit("readResponse", chatId, storeId);
    });
    
  });
  
  async function addMessage(roomId,message){
    await ChatModel.updateOne({_id:roomId},
      {
        $push:
        {messages:{
          text:message.text,
          senderType:message.senderType,
          senderId:message.senderId,
        }}})
  }

  // async function markMessagesAsRead(chatId, storeId) {
  //   try {
  //     const chat = await ChatModel.findOne({ _id: chatId });
  
  //     if (chat) {
  //       console.log(chatId,storeId);
  //       // Filter and update the messages array
  //       chat.messages.forEach((message) => {
  //         if (message.senderId.toString() !== storeId) {


  //           message.is_read = true;
  //         }
  //       });
  //       // Save the updated chat document
  //       await chat.save();
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  async function markMessagesAsRead(chatId, storeId) {
    try {
      const result = await ChatModel.aggregate([
        {
          $match: { _id:new mongoose.Types.ObjectId(chatId) },
        },
        {
          $unwind: '$messages',
        },
        {
          $match: { 'messages.senderId': { $ne: storeId } },
        },
        {
          $set: { 'messages.is_read': true },
        },
        {
          $group: {
            _id: '$_id',
            messages: { $push: '$messages' },
          },
        },
        {
          $project: {
            _id: 1,
            messages: 1,
          },
        },
      ]);
  
           
    } catch (error) {
      console.error(error);
    }
  }
  
  