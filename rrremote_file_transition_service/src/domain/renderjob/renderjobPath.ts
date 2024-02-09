//import path from 'path'
import { ValueObject } from 'ddd-base'
import { ERenderjob } from './renderjobType'
import { PathingService } from '../pathing/pathingService'

export interface RenderjobPathCollection {
  remote: RenderjobPath
  local: RenderjobPath
}

export interface RenderjobPathProps {
  type: ERenderjob
  value: string
}

export class RenderjobPath extends ValueObject<RenderjobPathProps>
  implements RenderjobPathProps {
    public type: ERenderjob
    public value: string

    private constructor(props: RenderjobPathProps) {
      super(props)
      this.type = props.type
      this.value = props.value
    }

    /**
     * @description A Factory method for creating RenderjobPaths Domain ValueObjects
     * @param artistID ArtistID of the current requesting Artist
     * @param renderjobID RenderjobID of the Renderjob which should be created
     * @param renderjobType RenderjobType Enumeration for identifying REMOTE and LOCAL RenderjobPaths
     * @returns A RenderjobPath ValueObject
     */
    public static createOneWith(artistID: string, renderjobID: string, renderjobType: ERenderjob) {
      let concatPath = ''
      // RemoteRenderjob path will be <artistID>/<renderjobID>, mapped to: <bucketname>/<objectname> of S3 (without extension)
      if (renderjobType === ERenderjob.REMOTE)
        concatPath = PathingService.retrieveRemotePathWith(artistID, renderjobID)

      // LocalRenderjob path will be based on the operating system
      // e.g.: lx64 will lead to a basepath of /mnt/RRPROJECTS/<DEV or PROD>, while win32 will lead to \\\\<ROYAL RENDER IP>\student\_IFS\<DEV or PROD>
      if (renderjobType === ERenderjob.LOCAL)
        concatPath = PathingService.retrieveLocalPathWith(artistID, renderjobID, process.platform)
      
      return new RenderjobPath({
        type: renderjobType,
        value: concatPath
      })
    }
  }
