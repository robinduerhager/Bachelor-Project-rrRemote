import fs from 'fs-extra'
import { Repo, PartialBy } from '../../../utils/types'
import { Renderjob } from '../../../domain/renderjob/renderjob'
import { minioClient } from '../../minio'
//import { ERenderjob } from '../../../domain/renderjob/renderjobType'
//import { PathingService } from '../../../domain/pathing/pathingService'
import { RenderjobSearchInput } from '.'
import { Storage } from '../../../domain/generated/graphql-types'
import { ZIP } from '../../../utils/ZIP'
import logger from '../../../utils/logger'
import { RRRemoteError } from '../../../utils/rrremoteError'

//TODO MISSING METHODS: uploadCompressedPreviews && uploadCompressedRenderings
export class RenderjobRemoteRepo implements Repo<Renderjob> {
  public constructor() {}

  /**
   * @description will search minio for an existing artistID bucket or also for an existing renderjob, based on the input provided.
   * @param input Consist of an artistID and optionally of a renderjobID.
   * @returns true if the bucket or renderjob (based on the input) exists, false if not
   */
  public async exists(
    input: PartialBy<RenderjobSearchInput, 'renderjobID'>
  ): Promise<boolean> {
    let bucketExists = false
    let renderjobExists = false

    // Check if the Bucket exists
    if (input.artistID) {
      bucketExists = await await minioClient.bucketExists(
        input.artistID.toLowerCase()
      )
    }

    // If whe have a renderjobID input, and a bucket Exists, check if the RenderjobID is already there
    if (input.renderjobID && bucketExists) {
      // There is no minioClient.exists function, so we have to workaround this with the statObject function. The try catch is only there, so the service does not crash when the requested object in minio is not existent.
      try {
        const objFound = await minioClient.statObject(
          input.artistID.toLowerCase(),
          input.renderjobID + '.zip'
        )
        if (objFound) renderjobExists = true
      } catch (err) {}
    }

    // If we have a renderjobID provided, the dev wants to check for bucket AND Renderjob existence, therefore return bucketExistence && renderjobExistence
    if (input.renderjobID) return bucketExists && renderjobExists

    // else only return bucketExistence
    return bucketExists
  }

  /**
   * @description fetches a Renderjob which is a merge between an RR Renderjob and a Firebase Firestore Renderjob
   * @param input RenderjobSearchInput, which can be a RenderjobID or an ArtistID
   * @returns A Domain Renderjob
   */
  public async fetchBy(input: RenderjobSearchInput): Promise<Renderjob> {
    const renderjobExists = await this.exists(input)
    if (!renderjobExists)
      throw new RRRemoteError(
        'Unable to find Renderjob in RemoteRepo',
        input.artistID,
        input.renderjobID
      )

    return Renderjob.createOneWith(input.renderjobID, input.artistID)
  }

  /**
   * @description Creates a MinIO Bucket for the Artist, if it does not exist yet, to evade unexpected Errors
   * @param artistID ArtistID of the artist which triggered this operation
   */
  public async createArtistBucket(artistID: string): Promise<boolean> {
    const bucketExists = await this.exists({
      artistID
    })

    if (bucketExists) return false

    await minioClient.makeBucket(artistID.toLowerCase(), '')
    return true
  }

  /**
   * @description Downloads a Renderjob from MinIO to the local Repository
   * @param renderjob The Domain Renderjob-object which should be Downloaded to the local Repository
   * @returns A String Array which holds all the Filepaths, relative to the specified Renderjob
   */
  public async fetchFilesOf(renderjob: Renderjob): Promise<string[]> {
    const renderjobExists = await this.exists({
      artistID: renderjob.artist.id.toValue().toLowerCase(),
      renderjobID: renderjob.id.toValue()
    })

    if (!renderjobExists)
      throw new RRRemoteError(
        'Unable to find Renderjob in RemoteRepo',
        renderjob.artist.id.toValue(),
        renderjob.id.toValue()
      )

    // Get a Readable Stream from the MinIO instance Renderjob, which we can pipe later to the local Repository
    const renderjobFromStream = await minioClient
      .getObject(
        renderjob.artist.id.toValue().toLowerCase(),
        renderjob.id.toValue() + '.zip'
      )
      .catch(err => {
        logger.error('Unable to retrieve Renderjob from the remote Repo', {
          err,
          artistID: renderjob.artist.id.toValue(),
          renderjobID: renderjob.id.toValue()
        })
      })
    const renderjobToStream = fs.createWriteStream(
      renderjob.path.local.value + '.zip'
    )

    return new Promise((resolve, reject) => {
      if (renderjobFromStream) {
        // Start unzipping the Renderjob, if the Stream piping succeeded
        renderjobFromStream.on('end', async () => {
          const relativePaths = await ZIP.uncompress(
            renderjob.path.local.value + '.zip',
            renderjob.path.local.value
          )
          resolve(relativePaths)
        })

        // Pipe the Readable Stream into the Writable Stream
        renderjobFromStream.pipe(renderjobToStream)
      } else {
        reject(
          new RRRemoteError(
            'renderjobFromStream is void',
            renderjob.artist.id.toValue(),
            renderjob.id.toValue()
          )
        )
      }
    })
  }

  /**
   * @param renderjob The Renderjob for whom the Storage space should be created for
   * @returns A Domain Storage object
   */
  public async createStorageSpace(renderjob: Renderjob): Promise<Storage> {
    let bucketExists = false
    let renderjobExists = false

    bucketExists = await this.exists({
      artistID: renderjob.artist.id.toValue()
    })

    // If the Bucket does not exist, try to initialize it
    if (!bucketExists)
      if (!(await this.createArtistBucket(renderjob.artist.id.toValue())))
        throw new RRRemoteError(
          'Unable to create Storage Space',
          renderjob.artist.id.toValue(),
          renderjob.id.toValue()
        )

    // if the Bucket did not exist, we don't have to check for renderjobs
    if (bucketExists)
      renderjobExists = await this.exists({
        artistID: renderjob.artist.id.toValue(),
        renderjobID: renderjob.id.toValue()
      })

    // if renderjob does already exist, bail out
    if (renderjobExists)
      throw new RRRemoteError(
        'Renderjob already exists',
        renderjob.artist.id.toValue(),
        renderjob.id.toValue()
      )

    return {
      bucketName: renderjob.artist.id.toValue().toLowerCase(),
      fileName: renderjob.id.toValue() + '.zip'
    }
  }
}
