'use strict';

const pino = require('pino');
const config = require('./config');

const transport = config.isProd
  ? undefined
  : {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    };

const logger = pino({
  level: process.env.LOG_LEVEL || (config.isProd ? 'info' : 'debug'),
  base: { service: 'overlays' },
  transport,
});

module.exports = logger;
