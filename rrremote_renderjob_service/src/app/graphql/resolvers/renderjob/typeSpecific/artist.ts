import { Context } from "../../../../../interfaces/server/server"
import { RenderjobMapper } from "../../../../../infrastructure/repos/mapper/RenderjobMapper"
import { DTORenderjob } from "../../../../../utils/types"
import { RRRemoteError } from "../../../../../utils/rrremoteError"
import logger from "../../../../../utils/logger"

// This query is a typespecific one. In this case, the extended Artist gets another attribute, called 'renderjobs' from the Renderjob Service. Since the Renderjob Service is responsible for finding those Renderjobs, it has to add those attributes to specific GraphQL-types
export const renderjobs = async (
  parent,
  args,
  { req, res, amqpClient, firestore, renderjobRepo }: Context,
  info
): Promise<DTORenderjob[]> => {
  logger.info('Artist-renderjobs Query triggered')
  //TODO a unique way to retrieve the artistid would be better
  let artistID: string
  if (Array.isArray(req.headers.artistid))
    artistID = req.headers.artistid[0]
  else
    artistID = req.headers.artistid

  // Fetching a Renderjob Domain object from the Renderjob Repository
  const drenderjobs = await renderjobRepo.findBy({
    artistID
  })

  if(!Array.isArray(drenderjobs))
    throw new RRRemoteError('renderjobs query should return an Array of renderjobs', artistID, drenderjobs.id.toValue())

  // If the drenderjob Array has no elements, we can also just return the empty Array (in GraphQL, it is better to return an empty Array than an Error)
  let renderjobs = []
  if (drenderjobs.length > 0)
    renderjobs = RenderjobMapper.toDTOArr(drenderjobs)

  logger.info('Artist-renderjobs Query success', {
    artistID
  })
  return renderjobs
}