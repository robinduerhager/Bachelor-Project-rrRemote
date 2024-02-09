import { RenderjobRemoteRepo } from './renderjobRemoteRepo'
//import { ERenderjob } from '../../../domain/renderjob/renderjobType'
import { RenderjobLocalRepo } from './renderjobLocalRepo'

export interface RenderjobSearchInput {
  artistID: string
  renderjobID: string
}

export const renderjobLocalRepo = new RenderjobLocalRepo()
export const renderjobRemoteRepo = new RenderjobRemoteRepo()