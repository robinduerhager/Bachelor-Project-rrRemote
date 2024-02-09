require('dotenv').config()
import './utils/extensions'
import logger from './utils/logger'
import { initApp } from './interfaces/server'

initApp(8080)
  .catch(err => {
    logger.error('Failed to initialize Service', {
      err
    })
  })