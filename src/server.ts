'use strict';
import {app} from './express-app';

const port = process.env.PORT || 3000;
app.set('port', port);


app.listen(app.get('port'), () => {
  console.log('Application running at localhost:'+app.get('port'));
}).on('error', err => {
  console.log('Cannot start server, port most likely in use');
  console.log(err);
});