import { AMQP } from '../../interfaces/amqp'
import { createSubmitRenderjobWorker } from './submitExtractedRenderjob'
import { updateRenderjobWorker } from './updateRenderjobWorker'
import logger from '../../utils/logger'

export const initAllAMQPWorker = async (amqpClient: AMQP) => {
  await createSubmitRenderjobWorker(amqpClient).catch(err => {
    logger.error('Unable to create createSubmitRenderjobWorker', {
      err
    })
  })
  await updateRenderjobWorker(amqpClient).catch(err => {
    logger.error('Unable to create updateRenderjobWorker', {
      err
    })
  })
}
