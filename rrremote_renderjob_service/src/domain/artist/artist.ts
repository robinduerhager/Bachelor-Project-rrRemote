import { Entity } from 'ddd-base'
import { UID } from './uid'

export interface artistProps {
  id: UID
}

export class DArtist extends Entity<artistProps> implements artistProps {
  public id: UID

  constructor(props: artistProps) {
    super(props)
    this.id = props.id
  }

  public static createOneWith(uid: string): DArtist {
    return new DArtist({
      id: new UID(uid)
    })
  }
}
