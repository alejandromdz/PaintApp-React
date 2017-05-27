'use strict';

// Include dependencies
import * as http from 'http';
import * as express from 'express';
import * as exphbs from 'express-handlebars';
import * as path from 'path';
import * as logger from 'morgan';
import * as favicon from 'serve-favicon';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as acceptLanguageParser from 'accept-language-parser';
import * as passport from 'passport';
import * as mongoose from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as errorHandler from 'errorhandler';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import * as ShareDB from 'sharedb';
import * as RedisShareDB from 'sharedb-redis-pubsub';
import * as ShareDBMongo from 'sharedb-mongo';
import * as WebSocket from 'ws';
import * as WebSocketJSONStream from 'websocket-json-stream';
import * as IO from 'socket.io';

import * as redis from 'redis';
import { userModel as User } from './models';
import * as routes from './routes';

// Main app
const hbs = exphbs.create({});
const dbUrl: string = 'mongodb://localhost/paint';
const db = mongoose.connect(dbUrl);
const dbShare = ShareDBMongo('mongodb://localhost/paint', { safe: true })
const redisClient = RedisShareDB(6379);
const share = new ShareDB({ db: dbShare, pubsub: redisClient });
const app: any = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });
const connection = share.connect();

server.listen(8080);

const users = [];
const io = IO(http.createServer().listen(8081));

io.on('connection', function (socket) {
  socket.on('disconnect', () => {
    users.splice(users.indexOf(socket.userId), 1);
    io.sockets.emit('update', users);
  })
  socket.on('login', (data) => {
    socket.userId = data.id;
    users.push(data.id);
    io.sockets.emit('update', users);
  });
});
function notifyFriend(req, res, next) {
  io.sockets.emit('notifications', { friends: 1 });
  next();
}


wss.on('connection', function (ws) {
  var stream = new WebSocketJSONStream(ws);
  share.listen(stream);
})

share.use('doc', (req, next) => {
  const { collection, id } = req;
  const doc = connection.get(collection, id);
  doc.fetch(function (err) {
    if (err) throw err;
    if (doc.type === null) {

      switch (collection) {
        case 'sessions':
          doc.create({ commands: [] }, function (err) {
            if (err) throw err
          });
          break;
        case 'chats':
          doc.create({ messages: [] }, function (err) {
            if (err) throw err
          });
          break;
      }

    }
  });
  next()

});

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// view engine setup
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('KKujdsOQiy-M21asVi1Nt-37anqLk6sw-ZXk5j0SXNP'));
app.use(express.static(path.join(__dirname, '/i18n')));
app.use(passport.initialize());
app.use(passport.session());

const cookieExtractor = function (req) {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies['token'];
  }
  return token;
};
const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: 'bu6Jp5QiNN-KDg2Xlb1Gz-Db6Btq9pmn'
}

passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
  User.findOne({ username: jwt_payload.sub }, function (err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  });
}));

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  User.findById(id, function (err, user) {
    if (err) { return cb(err, null); }
    cb(null, user);
  });
});


app.get('/', function (req: any, res: express.Response) {
  let lang;
  if (req.cookies['lang']) {
    lang = req.cookies['lang'];
  }
  else if (req.headers['accept-language']) {
    lang = acceptLanguageParser.parse(req.headers['accept-language'])[0].code;
  }
  switch (lang) {
    case 'en': res.redirect('/en'); break;
    case 'es': res.redirect('/es'); break;
    case 'jp': res.redirect('/jp'); break;
    default: res.redirect('/en'); break;
  }
});

app.get('/en', (req, res) => {
  res.sendFile(path.join(__dirname, '/i18n/en/index.html'));
})

app.get('/es', (req, res) => {
  res.sendFile(path.join(__dirname, '/i18n/es/index.html'));
})

app.get('/jp', (req, res) => {
  res.sendFile(path.join(__dirname, '/i18n/jp/index.html'));
})

app.post('/api/login', routes.login);
app.post('/api/register', routes.register);
app.put('/api/sessions', passport.authenticate('jwt'), routes.createsession);
app.get('/api/self', passport.authenticate('jwt'), routes.self);
app.get('/api/self/request/:id', passport.authenticate('jwt'), notifyFriend, routes.sendRequest);
app.get('/api/sessions/:id', passport.authenticate('jwt'), routes.getSessionById);
app.put('/api/sessions/:id', passport.authenticate('jwt'), routes.invite);
app.get('/api/search/:pattern', passport.authenticate('jwt'), routes.searchFriends);
app.get('/get-sandbox', routes.getSandbox);
app.get('/:id', routes.getSharedSession);

app.all('*', function (req, res) {
  res.sendFile(path.join(__dirname, '/404.html'));
})

export { app };
