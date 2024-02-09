import { Entity } from 'ddd-base'
import { RenderjobID } from './renderjobID'
import { Artist } from '../artist'
import { ERenderjob } from './renderjobType'
import { RenderjobPath, RenderjobPathCollection } from './renderjobPath'
//import { PathingService } from '../pathing/pathingService'

export interface RenderjobProps {
  id: RenderjobID
  artist: Artist
  path: RenderjobPathCollection
}

export class Renderjob extends Entity<RenderjobProps>
  implements RenderjobProps {
  public id: RenderjobID
  public artist: Artist
  public path: RenderjobPathCollection

  private constructor(props: RenderjobProps) {
    super(props)
    this.id = props.id
    this.artist = props.artist
    this.path = props.path
  }

  /**
   * @description Factory Method for creating Domain Renderjob Entities
   * @param renderjobID RenderjobID of the Renderjob which should be Created
   * @param artistID ArtistID of the requesting Artist
   * @returns A Domain Renderjob Entity
   */
  public static createOneWith(
    renderjobID: string,
    artistID: string
  ): Renderjob {

    return new Renderjob({
      id: new RenderjobID(renderjobID),
      artist: Artist.createOneWith(artistID),
      path: {
        remote: RenderjobPath.createOneWith(artistID, renderjobID, ERenderjob.REMOTE),
        local: RenderjobPath.createOneWith(artistID, renderjobID, ERenderjob.LOCAL)
      }
    })
  }
}
