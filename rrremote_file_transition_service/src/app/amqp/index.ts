import { CreateStorageRPCWorker } from './createStorage'
import { CreateOnRenderjobSubmitWorker } from './processRenderjobSubmit'
import { CreateOnRenderjobUpdateWorker } from './processRenderjobUpdate'
import { AMQP } from "../../interfaces/amqp"
import logger from '../../utils/logger'

export const initAllAMQPWorker = async (amqpClient: AMQP) => {
  await CreateStorageRPCWorker(amqpClient)
    .catch(err => {
      logger.error('Unable to create CreateStorageRPCWorker', {
        err
      })
    })
  await CreateOnRenderjobSubmitWorker(amqpClient)
  .catch(err => {
    logger.error('Unable to create CreateOnRenderjobSubmitWorker', {
      err
    })
  })
  await CreateOnRenderjobUpdateWorker(amqpClient)
  .catch(err => {
    logger.error('Unable to create CreateOnRenderjobUpdateWorker', {
      err
    })
  })
}