import { Context } from '../../../../../interfaces/server/server'
import { ERenderjobStatus } from '../../../../../domain'
import logger from '../../../../../utils/logger'
import { RenderjobMapper } from '../../../../../infrastructure/repos/mapper/RenderjobMapper'
import { DTORenderjob } from '../../../../../utils/types'

export const abort = async (
  parent,
  args,
  { req, res, amqpClient, firestore, renderjobRepo }: Context,
  info
): Promise<DTORenderjob> => {
  logger.info('abort Renderjob triggered', args.renderjobID)
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

  // Aborting a Renderjob in Royal Render via node modules is about just changing the Renderjobstatus, since a Renderjob is just a Finite State Machine
  // Therefore we can set the Status of the Renderjob to DISABLED, so that the Renderjob stops processing
  logger.info('Trying to abort Renderjob...', {
    artistID,
    renderjobID
  })
  const updatedRenderjob = await renderjob.update(undefined, {
    fbRenderjobStatus: ERenderjobStatus.DISABLED.valueOf()
  })

  return RenderjobMapper.toDTO(updatedRenderjob)
}
