import { AMQP } from "../../interfaces/amqp"
//import { Context } from "../../interfaces"
import { renderjobRemoteRepo } from "../../infrastructure"
import { Renderjob } from "../../domain/renderjob/renderjob"
import { RRRemoteError } from "../../utils/rrremoteError"
import logger from "../../utils/logger"

export const CreateStorageRPCWorker = async (amqpClient: AMQP) => {
  amqpClient.addRPCListener({
    topic: 'Renderjob',
    category: 'upload',
    action: 'requested'
  }, async msg => {
    if (!msg)
      throw new Error('Unable to read incoming Message of RPC Call')

    const convertedMsg = JSON.parse(msg.content.toString())

    if (!convertedMsg || !convertedMsg.renderjobID || !convertedMsg.artistID)
      throw new Error('Incoming Message of RPC Call has not the expected arguments')

    const {
      renderjobID,
      artistID
    } = convertedMsg

    logger.info('Creating Storage Space for Renderjob', {
      artistID,
      renderjobID
    })

    const storage = await renderjobRemoteRepo.createStorageSpace(
      Renderjob.createOneWith(renderjobID, artistID)
    )

    if (!storage)
      throw new RRRemoteError('Unable to create Storage Space', artistID, renderjobID)

    logger.info('Finished Creating Storage Space for Renderjob', {
      artistID,
      renderjobID
    })
    return storage
  })
}