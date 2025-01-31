import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    title: {
        type : String,
        required : true,
    },
    description: {
        type : String,
        required : true,
    },
    comment : [
        {
            type : Schema.Types.ObjectId,
            ref :"comment"
        }
    ]
},
{ timestamps: true }
);


export const Post = mongoose.model("Post", postSchema);
