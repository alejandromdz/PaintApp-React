
import { userModel as User, roomModel as Room } from '../models';
import * as jwt from 'jsonwebtoken';
import * as express from 'express';
import * as path from 'path';
import * as mongoose from 'mongoose';
import * as shortid from 'shortid';

//POST api/login
export function login(req, res) {
  User.findOne({
    username: req.body.username
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      res.send({ success: false, message: 'Authentication failed. User not found.' });
    }
    else 
    {
      if (user.get('password') === req.body.password) {
        var token = jwt.sign({ sub: user.get('username') }, 'bu6Jp5QiNN-KDg2Xlb1Gz-Db6Btq9pmn', {
          expiresIn: 6000
        });
        res.json({success: true,token: token,_id:user._id }).send();
      }
      else {
        res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
      }
    }
  });
}

//GET api/self
export function self(req, res) {

  const {user} = req;
  const {username, admin, _id} = user;
  let friends;
  User.findById(_id, function (error, user: any) {
    const {rooms} = user;
    User.getFriends(user, function (error, friendships) {
      if (error) friends = {}
      else {

        const pending = friendships.filter((friend) => friend.status === "pending").reduce((acc, current) => {
          const {added, status, _id, friend: {username}} = current;
          acc.push({ added, _id, status, username });
          return acc;
        }, []);

        const accepted = friendships.filter((friend) => friend.status === "accepted").reduce((acc, current) => {
          const {added, status, _id, friend: {username}} = current;
          acc.push({ added, _id, status, username });
          return acc;
        }, []);

        const requested = friendships.filter((friend) => friend.status === "requested").reduce((acc, current) => {
          const {added, status, _id, friend: {username}} = current;
          acc.push({ added, _id, status, username });
          return acc;
        }, []);
        friends = { accepted, pending, requested }
      }
      let response: any = { username, admin, _id, friends, rooms };
      Room.find({ owner: _id }, (err, owned) => {

        if (error) {
          response.rooms = { owned: [] };
        }
        else {
          response.rooms = { owned };
        }

        Room.find({ participants: _id  }, (err, others) => {
          if (error) {
            response.rooms.others = [];
          }
          else {
            response.rooms.others = others;
          }
          res.json(response);
        })
      })
    })
  });
}



//GET api/sessions/:id
export function getSessionById(req, res) {
  const {id} = req.params;
  res.render('session', { id })
}

//PUT api/sessions
export function createsession(req, res, next) {
  const {body: {x, y}, user: {_id}} = req;
  const room = new Room({
    owner: _id,
    x,
    y,
    created: new Date(),
    participants: []
  })

  room.save((error, room: any) => {
    if (error) { console.log(error) }
    User.findByIdAndUpdate(_id, { $push: { "rooms.owned": room._id } }, (err, user: any) => {
      if (error) { console.log(error) }
      res.send(200);
    });
  })
}

//POST api/register
export function register(req, res, next) {
  const {username, password} = req.body;
  const user = new User({
    username,
    password,
    friends: [],
    admin: true
  });

  User.findOne({ username }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      return res.status(409).send({ error: 'Account with that email address already exists.' });
    }
    user.save((err) => {
      if (err) {
        return next(err);
      }
      var token = jwt.sign({ username: user.get('username') }, 'bu6Jp5QiNN-KDg2Xlb1Gz-Db6Btq9pmn', {
        expiresIn: 300
      });
      res.json({ success: true, token: token });
    });
  });
}

//GET api/search
export function searchFriends(req, res, next) {
  const {pattern} = req.params;
  User.find({ username: new RegExp(pattern, 'ig') }).sort({ username: 1 }).exec((err, friends) => {
    if (err) {
      return next(err);
    }
    res.json(friends);
  })
}

//GET api/self/request/:id
export function sendRequest(req, res, next) {
  const {id: idFrom} = req.params;
  const {_id: idTo} = req.user;
  User.requestFriend(idFrom, idTo, function (...args) {
  })
}

//PUT api/sessions/:id
export function invite(req, res, next) {
  const {id: sessionId} = req.params;
  const {id: userId} = req.body;

  Room.findByIdAndUpdate(sessionId, { $push: { participants: userId } }, (error, session) => {
    User.findByIdAndUpdate(userId, { $push: { "rooms.others": session } }, (error, user) => {
      res.send(200);
    })
  });
}

//GET get-sandbox
export function getSandbox(req,res,next){
  res.render('sandbox')
}

//GET :id
export function getSharedSession(req,res,next){
    const {id} = req.params;

    Room.find({ _id:id }, (err, sessions) => {
      
      
      if (sessions.length===0)
      {
       res.sendFile(path.join(__dirname ,'../404.html'));
      }
else{
  res.render('shared', { id });
}
    });
}