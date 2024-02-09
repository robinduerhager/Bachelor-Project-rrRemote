import { Entity } from 'ddd-base'
import { RenderjobID } from './renderjobID'
import { Status, ERenderjobStatus, renderjobStati } from './status'
import { ERRrenderjobStatusValues } from '../../utils/types'
import { UID, DArtist } from '../artist'
import { renderjobRepo } from '../../infrastructure'

interface DRenderjobProps {
  id: RenderjobID
  title: string
  status: Status
  remainingRenderTime: number
  artist: DArtist
}

export class DRenderjob extends Entity<DRenderjobProps>
  implements DRenderjobProps {
  public id: RenderjobID
  public title: string
  public status: Status
  public artist: DArtist
  public remainingRenderTime: number

  private constructor(props: DRenderjobProps) {
    super(props)

    this.id = props.id
    this.title = props.title
    this.status = props.status
    this.artist = props.artist
    this.remainingRenderTime = props.remainingRenderTime
  }

  /**
   * @description A Factory function which creates a Renderjob Domain object
   * @param id RenderjobID of the Renderjob Domain object which should be created
   * @param title The Title of the Renderjob Domain object which should be created
   * @param artistID The ArtistID of the Artist which owns this Renderjob
   * @param status The Status of the Renderjob of the Renderjob Domain object which should be created
   * @param remainingRenderTime The RemainingRenderTime of the Renderjob Domain object which should be created
   * @returns A newly created Renderjob Domain object
   */
  public static async createOneWith(
    id: string,
    title: string,
    artistID: string,
    status: renderjobStati,
    remainingRenderTime: number
  ): Promise<DRenderjob> {
    return new DRenderjob({
      id: new RenderjobID(id),
      title,
      status: await Status.createOneWith(status),
      artist: DArtist.createOneWith(artistID),
      remainingRenderTime: remainingRenderTime
    })
  }

  /**
   * @description updates the local Renderjob Domain object with the specified parameters, also calls the RenderjobRepo update function, to keep data in sync
   * @param nextTitle The new Title which should be set for the oncalled renderjob Domain object
   * @param nextRenderjobStatus The new Renderjobstatus which should be set for the oncalled renderjob Domain object
   * @returns The updated Renderjob Domain object
   */
  public async update(
    nextTitle?: string,
    nextRenderjobStatus?: renderjobStati
  ): Promise<DRenderjob> {
    // Since ValueObjects are immutable, we have to create a new one
    // Store updated Objects into the on called object and then pass the on called object into the repo update function
    if (!nextTitle && !nextRenderjobStatus) return this
    
    if (nextRenderjobStatus)
      console.log("### NEW-RENDERJOB-STATUS: " + JSON.stringify(nextRenderjobStatus, undefined, 2))

    if (nextTitle)
      console.log('### NEW-RENDERJOB-TITLE: ' + nextTitle)

    this.status = nextRenderjobStatus
      ? Status.createOneWith(nextRenderjobStatus)
      : this.status
    this.title = nextTitle ? nextTitle : this.title

    console.log('### UPDATED-RENDERJOBSTATUS: ' + JSON.stringify(this.status, undefined, 2));

    // Call the Renderjob Repo with the newly updated local Renderjob Domain object, so the Repo is in Sync with the local Renderjob Domain object
    const updatedRenderjob = await renderjobRepo.update(this)
    return updatedRenderjob
  }
}
