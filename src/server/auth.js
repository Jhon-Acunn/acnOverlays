'use strict';

const config = require('./config');

function checkToken(token) {
  if (!config.authToken) return true;
  return typeof token === 'string' && token === config.authToken;
}

function httpAuth(req, res, next) {
  if (!config.authToken) return next();
  const header = req.get('X-Auth-Token') || '';
  const query = typeof req.query.token === 'string' ? req.query.token : '';
  const token = header || query;
  if (!checkToken(token)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  return next();
}

function socketAuth(socket, next) {
  if (!config.authToken) return next();
  const token =
    (socket.handshake.auth && socket.handshake.auth.token) ||
    socket.handshake.headers['x-auth-token'] ||
    socket.handshake.query?.token;
  if (!checkToken(token)) {
    return next(new Error('No autorizado'));
  }
  return next();
}

module.exports = { httpAuth, socketAuth, checkToken };
