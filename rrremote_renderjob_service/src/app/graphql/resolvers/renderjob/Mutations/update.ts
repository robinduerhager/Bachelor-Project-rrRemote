import { Context } from "../../../../../interfaces/server/server"
import logger from "../../../../../utils/logger"
import { RenderjobMapper } from "../../../../../infrastructure/repos/mapper/RenderjobMapper"
import { DTORenderjob } from "../../../../../utils/types"

export const update = async (
  parent,
  { renderjobID, title },
  { req, res, amqpClient, firestore, renderjobRepo }: Context,
  info
): Promise<DTORenderjob> => {
  logger.info('update Endpoint has been triggered')
  if (!req.headers.artistid)
    throw new Error('Unable to submit Renderjob')

  const artistID: string = Array.isArray(req.headers.artistid) ? req.headers.artistid[0] : req.headers.artistid

  // Fetching a Renderjob Domain object from the Renderjob Repository
  const renderjob = await renderjobRepo.findBy({
    renderjobID
  })

  if (Array.isArray(renderjob))
    throw new Error('Renderjob variable should not be an Array')

  // The Domain Renderjob uses the update function to update the Title of itself
  // It will call the Renderjob Repo update function, which will then update the Firebase Firestore entry accordingly
  logger.info('Trying to update the Renderjobtitle', {
    artistID,
    renderjobID,
    title
  })
  const updatedRenderjob = await renderjob.update(title)

  logger.info('Updating Renderjobtitle successfull', {
    artistID,
    renderjobID,
    title: updatedRenderjob.title
  })

  return RenderjobMapper.toDTO(updatedRenderjob)
}
