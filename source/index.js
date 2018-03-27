
import * as _ from 'lodash';
import express from 'express';
import http from 'http';
import socket from 'socket.io';

import Api from './Api';
import Statistics from './Statistics';
import SubscriptionManager from './SubscriptionManager';

const app = express();
const server = http.createServer(app);
const io = socket(server);

const port = 3000;
const statistics = new Statistics();
const api = new Api();
const manager = new SubscriptionManager(Statistics.RESOURCES);

api.on('initialize', () => {
  console.log('initialize');
});

api.on('visit', (v) => {
  statistics.addVisit(v);
});

io.on('connection', (socket) => {
  console.log('connection');

  socket.on('subscribe', (name) => {
    manager.subscribe(socket, name);
    //socket.emit(name, statistics.get(name));
  });

  socket.on('unsubscribe', (name) => {
    console.log(`someone unsubscribed from ${name}`);
    manager.unsubscribe(socket, name);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    manager.remove(socket);
  });
});

statistics.on('change', (name) => {
  manager.queue(name, statistics.get(name));
});

setInterval(() => {
  manager.push();
}, 1500);

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8082');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'good' });
  res.end();
});

console.log(`port ${port}`);
server.listen(port);
