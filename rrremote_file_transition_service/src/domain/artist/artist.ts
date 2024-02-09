import { Entity } from 'ddd-base'
import { UID } from './uid'

interface ArtistProps {
  id: UID
}

export class Artist extends Entity<ArtistProps> implements ArtistProps {
  public id: UID

  private constructor(props: ArtistProps) {
    super(props)
    this.id = props.id
  }

  /**
   * @description Factory method for creating an Artist domain Entity object
   * @param uid The ArtistID of the currently requesting Artist
   * @returns An Artist domain Entity object
   */
  public static createOneWith(uid: string): Artist {
    return new Artist({
      id: new UID(uid)
    })
  }
}