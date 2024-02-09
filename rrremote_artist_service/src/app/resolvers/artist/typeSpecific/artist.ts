import { Context } from '../../../../interfaces/server/server'
import { Artist } from '../../../../domain/generated/graphql-types'
import { artistMapper } from '../../../../infrastructure/repos/artist/Mapper'
import logger from '../../../../utils/logger'

// The __resolveReference Method will be called if an Artist-Reference-Object is being requested by another Apollo Federation Resolver. These typically look similar to: { __typename: 'Artist', uid: parent.artist } (see Renderjob Service src/interfaces/graphql/resolvers/renderjob/typeSpecific/renderjob.ts) 
// This function is there to resolve those References into more detailed Objects from the specific Service Database
const __resolveReference = async (
  parent,
  { artistRepo }: Context
): Promise<Artist> => {
  logger.info('Resolving Artist Reference...')
  const dArtist = await artistRepo.findBy({ uid: parent.uid })
  logger.info('Resolving Artist Reference Successfull')
  return await artistMapper.toDTO(dArtist)
}

export { __resolveReference }
