import professionalsModel from "../models/professionalSchema.js";
import userModel from "../models/userSchema.js";
import chatModel from "../models/chatSchema.js";
import mongoose from "mongoose";

export const loadChat = async (req, res) => {
  try {
    const { receiverId, type, senderId, chatId } = req.query;

    if (receiverId) {
      const chat = await chatModel
        .findOne({
          $and: [{ user: senderId }, { professional: receiverId }],
        })
        .populate("professional")
        .populate("user");

      if (chat) {
        res.status(200).json({ chat });
      } else {
        const chat = await chatModel.create({
          user: senderId,
          professional: receiverId,
        });
        res.status(200).json({ chat });
      }
    } else {
      const chat = await chatModel
        .findOne({ _id: chatId })
        .populate("professional")
        .populate("user");
      if (chat) {
        res.status(200).json({ chat });
      }
    }
  } catch (error) {
    res.status(500).json({ errMsg: "Server error" });
    console.log(error);
  }
};

export const listChat = async (req, res) => {
  try {
    const { id, type } = req.query;

    if (type == "user") {
      const list = await chatModel
        .find({ user: id })
        .populate("professional")
        .populate("user");
      // Sort the list based on the timestamp of the last message
      list.sort(
        (chatA, chatB) => {
        const lastMessageA = chatA.messages?.[chatA.messages.length - 1];
        const lastMessageB = chatB.messages?.[chatB.messages.length - 1];
        if (!lastMessageA || !lastMessageB) {
          return 0;
        }
        const timestampA = new Date(lastMessageA.timestamp);
        const timestampB = new Date(lastMessageB.timestamp);
        // Sort in descending order (most recent first)
        return timestampB - timestampA;
          }
         );
      if (list) {
        res.status(200).json({ list });
      }
    } else if (type == "pro") {
      const list = await chatModel
        .find({ professional: id })
        .populate("user")
        .populate("professional");
      // Sort the list based on the timestamp of the last message
      list.sort((chatA, chatB) => {
        const lastMessageA = chatA.messages?.[chatA.messages.length - 1];
        const lastMessageB = chatB.messages?.[chatB.messages.length - 1];

        if (!lastMessageA || !lastMessageB) {
          return 0;
        }

        const timestampA = new Date(lastMessageA.timestamp);
        const timestampB = new Date(lastMessageB.timestamp);

        // Sort in descending order (most recent first)
        return timestampB - timestampA;
      });

      if (list) {
        res.status(200).json({ list });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const addMessage = async (roomId, message) => {
  const save = await chatModel.updateOne(
    { _id: roomId },
    {
      $push: {
        messages: {
          text: message.text,
          senderType: message.senderType,
          senderId: message.senderId,
        },
      },
    }
  );
};

export const markMessagesAsRead = async (chatId, storeId) => {
  try {
    //   const result = await chatModel.aggregate([
    //     {
    //       $match: { _id:new mongoose.Types.ObjectId(chatId) },
    //     },
    //     {
    //       $unwind: '$messages',
    //     },
    //     {
    //       $match: { 'messages.senderId': { $ne: storeId } },
    //     },
    //     {
    //       $set: { 'messages.is_read': true },
    //     },
    //     {
    //       $group: {
    //         _id: '$_id',
    //         messages: { $push: '$messages' },
    //       },
    //     },
    //     {
    //       $project: {
    //         _id: 1,
    //         messages: 1,
    //       },
    //     },
    //   ]);

    const chat = await chatModel.findOne({ _id: chatId });

    if (chat) {
      // Filter and update the messages array
      chat.messages.forEach((message) => {
        if (message.senderId.toString() !== storeId) {
          message.is_read = true;
        }
      });
      // Save the updated chat document
     return await chat.save();
    }
  } catch (error) {
    console.error(error);
  }
};
