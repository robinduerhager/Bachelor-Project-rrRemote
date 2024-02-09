import {
  renderjobFileMutations,
  renderjobFileQueries,
  renderjobResolver,
  artistResolver,
  storageResolver
} from './renderjob'

const Mutation = {
  ...renderjobFileMutations
}

const Query = {
  ...renderjobFileQueries
}

const Renderjob = {
  ...renderjobResolver
}

const Artist = {
  ...artistResolver
}

const Storage = {
  ...storageResolver
}

const resolvers = {
  Mutation,
  Query,
  Renderjob,
  Artist,
  Storage
}

export default resolvers
