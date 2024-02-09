import { createRenderjob, submit, update, abort } from './Mutations'
import { renderjob } from './Queries'
import { renderjobResolver, artistResolver, storageResolver } from './typeSpecific'

const renderjobFileMutations = {
  createRenderjob,
  submit,
  update,
  abort
}

const renderjobFileQueries = {
  renderjob
}

export {
  renderjobFileMutations,
  renderjobFileQueries,
  renderjobResolver,
  artistResolver,
  storageResolver
}