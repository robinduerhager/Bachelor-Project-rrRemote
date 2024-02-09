import { RequireOnlyOne, Repo } from '../../../utils/types'
import { Artist } from '../../../domain/generated/graphql-types'
import { firebaseAuth } from '../../firebase'
import { auth } from 'firebase-admin'

import { artistMapper } from './Mapper'
import { DArtist } from '../../../domain'

export interface IDArtistSearchInput {
  uid?: string
  email?: string
}

/**
 * @description Artist Repository should wrap the Firebase Auth - admin SDK as a DB which can be fetched
 */
export class ArtistRepo implements Repo<DArtist> {
  private model: auth.Auth

  public constructor() {
    this.model = firebaseAuth
  }

  /**
   * @description Finds the Artist in the Repository by the specified input parameter.
   * @param input The input for finding an Artist in the Repository. Can be an Object with a uid or an email respectively. If provided both, the uid will be preferred, because of its uniqueness.
   * @returns The requested Artist from the Repository.
   */
  public async findBy(
    input: RequireOnlyOne<IDArtistSearchInput, 'uid' | 'email'>
  ): Promise<DArtist> {
    let artistRecord: auth.UserRecord
    
    if (!!input.uid) artistRecord = await this.model.getUser(input.uid)
    else if (!!input.email) artistRecord = await this.model.getUserByEmail(input.email)
    else throw new Error('Unable to find Artist by the specified Input')

    return await artistMapper.toDomain(artistRecord)
  }

  /**
   * @description This function looks if there is already a similar Artist in the Repository.
   * @param record The Artist which should be checked.
   * @returns true if there is already an Artist which is the same as the input, false if there is no such Artist in the Repository.
   */
  public async exists(record: RequireOnlyOne<Exclude<Artist, "__typename">, "uid" | "email">): Promise<boolean> {
    if (!!record.uid)
      return !!(await this.model.getUser(record.uid))
    
    if (!!record.email)
      return !!(await this.model.getUserByEmail(record.email))

    throw new Error('Unable to check existence of requested User')
  }
}
