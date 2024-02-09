require('dotenv').config()
import './utils/extensions'
import { initApp } from './interfaces'
import logger from './utils/logger'

initApp(process.env.NODE_ENV === 'production' ? 8080 : 4122)
.catch(err => {
  if (err)
  logger.error('Failed to initialize Service', err)
})