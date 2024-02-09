import { ValueObject } from 'ddd-base'
import { ERRrenderjobStatusValues } from '../../utils/types'
import { StatusMapper } from '../../infrastructure/repos/mapper'

export interface statusProps {
  renderjobStatus: ERenderjobStatus
}

/**
 * @description A renderjobStatis definitely has a Firebase renderjobstatus, and maybe a Royal Render status
 */
export interface renderjobStati {
  fbRenderjobStatus: ERenderjobStatus | number
  rrRenderjobStatus?: ERRrenderjobStatusValues | number
}

/**
 * @description Defines all Renderjobstati that are possible in rrRemote, begins at the numerical value of 300, so it does not conflict with the Renderjobstati from Royal Render. With that, we can also evaluate the latest Renderjobstatus by comparing their values
 */
export enum ERenderjobStatus {
  UPLOADING = 300,
  UPLOADED = 301,
  SUBMITTING = 302,
  PRERENDER = 303,
  PREVIEWS = 304,
  RENDERING = 305,
  POSTRENDER = 306,
  FINISHED = 307,
  PREPARINGDOWNLOAD = 308,
  DOWNLOADABLE = 309,
  DISABLED = 310,
  ERROR = 311
}

export class Status extends ValueObject<statusProps> implements statusProps {
  public renderjobStatus: ERenderjobStatus

  private constructor(props: statusProps) {
    super(props)

    this.renderjobStatus = props.renderjobStatus
  }

  /**
   * @description A Factory function for creating new Renderjobstati ValueObjects for the Renderjob Domain Object
   * @param renderjobStati The RenderjobStati, that definitely has a Firebase renderjobstatus, and maybe a new Royal Render status
   * @returns a new Status ValueObject
   */
  public static createOneWith(
    /* renderjobID: string, */
    renderjobStati: renderjobStati
  ): Status {
    console.log("### NEW-RENDERJOB-STATUS-BEFORE-CONVERSION: " + JSON.stringify(renderjobStati, undefined, 2))
    if (renderjobStati.rrRenderjobStatus)
      return new Status({
        renderjobStatus: Status.chooseStatus(
          StatusMapper.convertRawStatusToDomain(
            renderjobStati.fbRenderjobStatus
          ),
          StatusMapper.convertRawStatusToDomain(
            renderjobStati.rrRenderjobStatus
          )
        )
      })
    return new Status({
      renderjobStatus: Status.chooseStatus(
        StatusMapper.convertRawStatusToDomain(renderjobStati.fbRenderjobStatus)
      )
    })
  }

  /**
   * @description Evaluates if the Firebase Renderjobstatus or the Royal Render Renderjobstatus is 'later' in the rendering process.
   * @returns The Renderjobstatus that is 'later' in the rendering process
   */
  private static chooseStatus(
    dbRenderjobStatus: ERenderjobStatus,
    rrRenderjobStatus?: ERenderjobStatus
  ): ERenderjobStatus {
    console.log('### chooseStatus__dbRenderjobStatus: ' + dbRenderjobStatus)
    if (rrRenderjobStatus)
    console.log('### chooseStatus__rrRenderjobStatus: ' + rrRenderjobStatus)
    if (!rrRenderjobStatus) return dbRenderjobStatus

    // Look which Renderjobstatus is 'later' in the Rendering Process of rrRemote and return it
    if (rrRenderjobStatus > dbRenderjobStatus) {
      return rrRenderjobStatus
    } else {
      return dbRenderjobStatus
    }
  }
}
