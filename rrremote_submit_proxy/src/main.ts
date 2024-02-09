require('dotenv').config()
import './utils/extensions'
import { initApp } from './server/server'

initApp(7775)
.catch(err => {
  if (err)
    console.error(err)
})