import * as winston from 'winston'
import LogzioWinstonTransport from 'winston-logzio'

const logzioWinstonTransport = new LogzioWinstonTransport({
  level: 'info',
  name: 'winston_logzio',
  token: process.env.LOGZIO_TOKEN,
  host: '<LOGZIO URL>'
})

const consoleTransport = new winston.transports.Console({
  level: 'debug',
  format: winston.format.simple()
})

const logger = winston.createLogger({
  transports: [logzioWinstonTransport, consoleTransport],
  defaultMeta: { service: 'Renderjob-Service' }
})

export default logger