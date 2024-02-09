import { Context } from '../../../../../interfaces/server/server'
import { StatusMapper } from '../../../../../infrastructure/repos/mapper'
import logger from '../../../../../utils/logger'
import { RRRemoteError } from '../../../../../utils/rrremoteError'
import { RenderjobMapper } from '../../../../../infrastructure/repos/mapper/RenderjobMapper'
import { DTORenderjob } from '../../../../../utils/types'

export const renderjob = async (
  parent,
  args,
  { req, res, amqpClient, firestore, renderjobRepo }: Context,
  info
): Promise<DTORenderjob> => {
  logger.info('renderjob Query triggered')
  const artistID: string = Array.isArray(req.headers.artistid)
    ? req.headers.artistid[0]
    : req.headers.artistid

  // Fetching a Renderjob Domain object from the Renderjob Repository
  const renderjob = await renderjobRepo.findBy({
    renderjobID: args.id
  })

  if (Array.isArray(renderjob))
    throw new RRRemoteError(
      'Renderjob Query should not include an Array',
      artistID,
      args.id
    )

  logger.info('renderjob Query successfull')
  return RenderjobMapper.toDTO(renderjob)
}
