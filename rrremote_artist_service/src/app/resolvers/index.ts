import { artistQueries,
  artistSpecifics } from './artist'

const Query = {
  ...artistQueries
}

const Mutation = {}

const Artist = {
  ...artistSpecifics
}

// Stitch all Queries, Mutations and Typespecific fields together
const resolvers = {
    Query,
    Mutation,
    Artist
}

// Group ALL Resolvers for this App
export default resolvers