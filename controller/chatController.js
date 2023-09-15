import professionalsModel from "../models/professionalSchema.js";
import userModel from "../models/userSchema.js";
import chatModel from "../models/chatSchema.js"

export const loadChat = async(req,res)=>{
    try {
        const {receiverId,type,senderId,chatId} = req.query

            if(receiverId){
            const chat = await chatModel.findOne({
                $and:[
                    {user:senderId},
                    {professional:receiverId}
                ]
            }).populate('professional').populate('user')

            if(chat){
                res.status(200).json({chat})
            }else{
                const chat = await chatModel.create({
                    user:senderId,
                    professional:receiverId
                })
                res.status(200).json({chat})
            }
        }else{
            const chat = await chatModel.findOne({_id:chatId}).populate('professional').populate('user')
            if(chat){
                res.json({chat})
            } 
        }
      
    } catch (error) {
        res.status(500).json({ errMsg: 'Server error' })
        console.log(error);
    }
}

export const listChat = async (req,res)=>{
    try {
        const {id,type} = req.query

        if(type=='user'){
            const list = await chatModel.find({user:id}).populate('professional').populate('user')
        if(list){
            res.status(200).json({list})
        } 
        }else if(type=="pro"){
            const list = await chatModel.find({professional:id}).populate('user').populate('professional')
        if(list){
            res.status(200).json({list})
        }
        }
        
    } catch (error) {
        console.log(error);
    }
}