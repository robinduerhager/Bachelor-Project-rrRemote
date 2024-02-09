import fs from 'fs-extra'
import { Repo } from '../../../utils/types'
import { Renderjob } from '../../../domain/renderjob/renderjob'
//import { minioClient } from '../../minio'
//import { ERenderjob } from '../../../domain/renderjob/renderjobType'
import { PathingService } from '../../../domain/pathing/pathingService'
import { RenderjobSearchInput } from '.'
import { RRRemoteError } from '../../../utils/rrremoteError'

//TODO MISSING METHODS: compress Previews
export class RenderjobLocalRepo implements Repo<Renderjob> {
  public constructor() {}

  /**
   * @description checks if the specified RenderjobID and ArtistID exists as a folder path on the local filesystem
   * @param input The RenderjobSearchInput which is a RenderjobID an an ArtistID
   * @returns true, if the Renderjob exists on the local filesystem, false otherwise
   */
  public async exists(
    input: RenderjobSearchInput
  ): Promise<boolean> {
    const pathExists = fs.pathExistsSync(
      PathingService.retrieveLocalPathWith(
        input.artistID,
        input.renderjobID,
        process.platform
      )
    )

    return pathExists
  }

  /**
   * @description Gets a Domain Renderjob object based on the specified RenderjobID and ArtistID
   * @param input The RenderjobSearchInput which is a RenderjobID and an ArtistID
   * @returns a Domain Renderjob
   */
  public async fetchBy(input: RenderjobSearchInput): Promise<Renderjob> {
    const renderjobExists = await !this.exists(input)
    if (!renderjobExists)
      throw new RRRemoteError('Unable to find Renderjob in LocalRepo', input.artistID, input.renderjobID)

    return Renderjob.createOneWith(input.renderjobID, input.artistID)
  }
}
