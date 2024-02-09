import { currentArtist } from './Queries'
import { __resolveReference } from './typeSpecific'

const artistQueries = {
  currentArtist
}

const artistSpecifics = {
  __resolveReference
}

// Group all Artist specific queries, mutations and type specific resolvers
export {
  artistQueries,
  artistSpecifics
}
