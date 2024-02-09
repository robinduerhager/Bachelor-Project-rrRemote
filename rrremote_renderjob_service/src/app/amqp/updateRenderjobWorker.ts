import { AMQP } from '../../interfaces/amqp'
import { renderjobRepo } from '../../infrastructure'
import { StatusMapper } from '../../infrastructure/repos/mapper'
import logger from '../../utils/logger'
import { RRRemoteError } from '../../utils/rrremoteError'

/**
 * @description Updates a Renderjob with the incoming new Renderjobstatus
 * @param amqpClient The generated amqpClient
 */
export const updateRenderjobWorker = async (amqpClient: AMQP) => {
  amqpClient.addListener(
    {
      topic: 'Renderjob',
      category: 'status',
      action: 'update'
    },
    async msg => {
      logger.info('Renderjobstatus update triggered')
      if (!msg) throw new Error('Unable to resolve Renderjob Info')
      amqpClient.acknowledge(msg)

      const convertedMsg = JSON.parse(msg.content.toString())

      if (!convertedMsg) throw new Error('Unable to update Renderjob')
      console.log(JSON.stringify(convertedMsg, undefined, 2))
      if (
        convertedMsg.initiator &&
        convertedMsg.initiator === amqpClient.serviceName
      )
        return
      if (!convertedMsg.renderjobID || !convertedMsg.status)
        throw new Error('Unable to update Renderjob')

      const renderjobID = convertedMsg.renderjobID
      logger.info('Updating Renderjobstatus...', {
        renderjobID,
        incomingStatus: parseInt(convertedMsg.status)
      })

      // Fetching a Renderjob Domain object from the Renderjob Repository
      const renderjob = await renderjobRepo.findBy({
        renderjobID
      })
      console.log("### REPO-RENDERJOB: " + JSON.stringify(renderjob, undefined, 2))

      if (Array.isArray(renderjob)) return

      // Call the update method on the Renderjob Domain Object
      // That method also calls the Renderjob Repository update function
      const nextRenderjob = await renderjob.update(undefined, {
        fbRenderjobStatus: parseInt(convertedMsg.status)
      })
      console.log("### UPDATED-RENDERJOB: " + JSON.stringify(nextRenderjob, undefined, 2))
      if (!nextRenderjob)
        throw new RRRemoteError(
          'Unable to update Renderjob',
          renderjob.artist.id.toValue(),
          renderjob.id.toValue()
        )

      logger.info('Renderjobstatus updated', {
        renderjobID,
        updatedStatus: nextRenderjob.status.renderjobStatus.toString()
      })
      return
    }
  )
}
