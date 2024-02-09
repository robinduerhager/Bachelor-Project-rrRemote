import { artist, storage } from './renderjob'
import { renderjobs } from './artist'
import { renderjobID } from './storage'

export const renderjobResolver = {
  artist,
  storage
}

export const artistResolver = {
  renderjobs
}

export const storageResolver = {
  renderjobID
}