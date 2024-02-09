require('dotenv').config()
import { initApp } from './interfaces'
import logger from './utils/logger'

initApp(process.env.NODE_ENV === 'production' ? 8080 : 6461)
  .catch(err => {
    logger.error('Unable to initialize Artist-Service', err)
  })
