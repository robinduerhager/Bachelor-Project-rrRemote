import { Context } from '../../../../../interfaces/server/server'
import { ERenderjobStatus } from '../../../../../domain'
import logger from '../../../../../utils/logger'
import { RenderjobMapper } from '../../../../../infrastructure/repos/mapper/RenderjobMapper'
import { DTORenderjob } from '../../../../../utils/types'

export const submit = async (
  parent,
  args,
  { req, res, amqpClient, firestore, renderjobRepo }: Context,
  info
): Promise<DTORenderjob> => {
  logger.info('submit Endpoint triggered')
  if (!req.headers.artistid) throw new Error('Unable to submit Renderjob')

  const artistID: string = Array.isArray(req.headers.artistid)
    ? req.headers.artistid[0]
    : req.headers.artistid
  const renderjobID: string = args.renderjobID

  // Fetching a Renderjob Domain object from the Renderjob Repository
  const renderjob = await renderjobRepo.findBy({
    renderjobID
  })

  if (Array.isArray(renderjob))
    throw new Error('Renderjob variable should not be an Array')

  logger.info('Updating the Renderjobstatus to SUBMITTING', {
    artistID,
    renderjobID
  })
  const updatedRenderjob = await renderjob.update(undefined, {
    fbRenderjobStatus: ERenderjobStatus.SUBMITTING.valueOf()
  })

  // Sending a Renderjob Submit Requested Message, so the File-Service starts preparing the submittable Renderjob
  logger.info('Sending a Renderjob Submit Requested Message', {
    artistID,
    renderjobID
  })
  amqpClient.publishEvent(
    {
      topic: 'Renderjob',
      category: 'submit',
      action: 'requested'
    },
    {
      artistID,
      renderjobID
    }
  )

  return RenderjobMapper.toDTO(updatedRenderjob)
}
