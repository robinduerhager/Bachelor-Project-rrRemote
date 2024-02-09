import { Context } from '../../../../interfaces/server/server'
import { Artist } from '../../../../domain/generated/graphql-types'
import { DArtist } from '../../../../domain'
import { artistMapper } from '../../../../infrastructure/repos/artist/Mapper'
import logger from '../../../../utils/logger'

// This is the Resolver of the currentArtist GraphQL-Endpoint
// It fetches a Domain Artist from the Database and maps it to a DTOArtist, which will be returned to the requesting client
const currentArtist = async (
  parent,
  args,
  { req, artistRepo }: Context,
  info
): Promise<Artist> => {
  logger.info('currentArtist Endpoint triggered')
  // We can only use this query if we get the artistID from the header.
  if (!req.headers.artistid)
    throw new Error('Something went wrong, querying the current Artist')

  const artistid = req.headers.artistid
  let artist: DArtist

  
  if (Array.isArray(artistid))
    artist = await artistRepo.findBy({ uid: artistid[0] })
  else 
    artist = await artistRepo.findBy({ uid: artistid })

  const artistDTO = await artistMapper.toDTO(artist)
  
  logger.info('currentArtist Endpoint successfull')
  return artistDTO
}

export default currentArtist
