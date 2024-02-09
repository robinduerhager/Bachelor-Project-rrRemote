import { Entity } from 'ddd-base'
import { UID } from './uid'
import { Email } from './email'

//########## ENTITIES ##########
export interface DArtistProps {
  id: UID
  email: Email
}

export class DArtist extends Entity<DArtistProps> implements DArtistProps {
  public id: UID
  public email: Email

  constructor(props: DArtistProps) {
    super(props)
    this.id = props.id
    this.email = props.email
  }

  /**
   * @description A Factory method for creating Domain Artists
   * @param uid The UID of the currently requesting Artist
   * @param email The E-Mail of the currently requesting Artist
   * @returns A Domain Artist Entity object
   */
  public static createDArtist(uid: string, email: string): DArtist{
    return new DArtist({
      id: new UID(uid),
      email: new Email({
        name: email
      })
    })
  }
}