require('dotenv').config()
import { init } from './server'
import logger from './utils/logger'

init({
  port: 8080
})
.catch(err => {
  logger.error('Unable to initialize Apollo Gateway', err)
})
