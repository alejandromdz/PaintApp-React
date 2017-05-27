'use strict'

import * as mongoose from 'mongoose';
import * as friends from 'mongoose-friends';
import * as shortid from 'shortid';
shortid.seed(29283449);

const ObjectId=mongoose.Schema.Types.ObjectId

//Friendship Schema
const friendshipSchema:mongoose.Schema=new mongoose.Schema({
  status: {
    type: String, 
    enum: ['pending','accepted','requested']
  },
  added: Date,
  _id:{
    type:ObjectId,
    ref:'User'
  }
});

//Room Schema
const roomSchema: mongoose.Schema = new mongoose.Schema({
  _id: {
    type: String,
    "default": shortid.generate,
    required: true
  },
  owner:  {
      type: ObjectId,
      ref: 'User'
  },

  participants: [{
      type: ObjectId,
      ref: 'User'
  }],
  x:Number,
  y:Number,
  created: Date

})


//User Schema
const userSchema:mongoose.Schema=new mongoose.Schema({
    _id:{
      type:ObjectId,
      required:true,
     default: ()=> new mongoose.Types.ObjectId()
    },
     username: {
        type: String,
        required: true,
        set: function(value) {return value.trim().toLowerCase()},
        validate: [
          function(username:String) {
        return (username.match(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i) != null)},
      'Invalid email'] 
    },
    password: String,
    admin: {
        type: Boolean,
        default: false
  },
    friends:{
      accepted:[friendshipSchema],
      requested:[friendshipSchema],
      pending:[friendshipSchema]
    },
    rooms:{
      owned:[{type:String, ref:"Room"}],
      others:[{type:String, ref:"Room"}]
    }
});


userSchema.plugin(friends());

const friendshipModel=mongoose.model('Friendship',friendshipSchema);
const roomModel = mongoose.model('Room', roomSchema);
const userModel = mongoose.model('User', userSchema);

export { userModel, roomModel,friendshipModel};