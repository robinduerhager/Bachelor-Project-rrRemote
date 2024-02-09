import { ERRrenderjobStatusValues } from '../../../utils/types'
import { ERenderjobStatus } from '../../../domain'

export class StatusMapper {
  /**
   * @description This function converts a raw input Renderjobstatus from Firebase or Royal Render to a ERenderjobStatus Enumeration. Therefore, we don't have to work with different Status formats
   * @param raw The input status, coming straight from Royal Render or Firebase
   * @returns A ERenderjobStatus from the raw input Renderjobstatus
   */
  public static convertRawStatusToDomain(
    raw: number
  ): ERenderjobStatus | undefined {
    console.log('### RAW-STATUS: ' + raw)
    console.log('### RAW-STATUS-TYPE: ' + typeof raw)
    if (raw >= ERRrenderjobStatusValues.sNone && raw <= ERRrenderjobStatusValues.sFinished) {
      // Convert a Royal Render Status to a ERenderjobStatus
      console.log("CONVERTING-RRRAW-STATUS-TO-DOMAIN: " + raw);
      switch (raw) {
        case ERRrenderjobStatusValues.sScriptPreRender:
          console.log("CONVERTING-RRRAW-STATUS-TO-sScriptPreRender: " + raw);
          return ERenderjobStatus.PRERENDER

        case ERRrenderjobStatusValues.sPreviewRender:
          console.log("CONVERTING-RRRAW-STATUS-TO-sPreviewRender: " + raw);
          return ERenderjobStatus.PREVIEWS

        case ERRrenderjobStatusValues.sMainRender:
          console.log("CONVERTING-RRRAW-STATUS-TO-sMainRender: " + raw);
          return ERenderjobStatus.RENDERING

        case ERRrenderjobStatusValues.sScriptPostRender:
          console.log("CONVERTING-RRRAW-STATUS-TO-sScriptPostRender: " + raw);
          return ERenderjobStatus.POSTRENDER

        case ERRrenderjobStatusValues.sScriptFinished:
          console.log("CONVERTING-RRRAW-STATUS-TO-sScriptFinished-sFinished: " + raw)
          return ERenderjobStatus.FINISHED

        case ERRrenderjobStatusValues.sFinished:
          console.log("CONVERTING-RRRAW-STATUS-TO-sFinished: " + raw);
          return ERenderjobStatus.FINISHED

        default:
          console.log("ERROR-CONVERTING-RRRAW-STATUS-TO-DOMAIN: " + raw);
          return undefined
      }
    } else if (raw < ERenderjobStatus.ERROR && raw >= ERenderjobStatus.UPLOADING) {
      // Convert a Firebase Renderjobstatus to a ERenderjobStatus, which is probably already the format of the Firebase Renderjobstatus
      // This is probably not the best way to convert a raw input to a Domain Renderjobstatus
      // This should be condensed to a better, easier to read format

      console.log("CONVERTING-FBRAW-STATUS-TO-DOMAIN: " + raw);
      switch (raw) {
        case ERenderjobStatus.UPLOADING:
          return ERenderjobStatus.UPLOADING

        case ERenderjobStatus.UPLOADED:
          return ERenderjobStatus.UPLOADED

        case ERenderjobStatus.SUBMITTING:
          return ERenderjobStatus.SUBMITTING

        case ERenderjobStatus.PRERENDER:
          return ERenderjobStatus.PRERENDER

        case ERenderjobStatus.PREVIEWS:
          return ERenderjobStatus.PREVIEWS

        case ERenderjobStatus.RENDERING:
          return ERenderjobStatus.RENDERING

        case ERenderjobStatus.POSTRENDER:
          return ERenderjobStatus.POSTRENDER

        case ERenderjobStatus.FINISHED:
          return ERenderjobStatus.FINISHED

        case ERenderjobStatus.PREPARINGDOWNLOAD:
          return ERenderjobStatus.PREPARINGDOWNLOAD

        case ERenderjobStatus.DOWNLOADABLE:
          return ERenderjobStatus.DOWNLOADABLE

        case ERenderjobStatus.DISABLED:
          return ERenderjobStatus.DISABLED

        default:
          return undefined
      }
    } else if (raw === ERenderjobStatus.ERROR) {
      return ERenderjobStatus.ERROR
    } else {
      throw new Error(`Unable to determine Status Type, Status: ${raw}`)
    }
  }

  /**
   * @description Converts a ERenderjobStatus to a String in human readable format
   * @param input The ERenderjobStatus which should be converted to a String
   * @returns The ERenderjobStatus as a String in a human readable format
   */
  public static statusToString(input: ERenderjobStatus): string {
    // This way, the frontend won't get numeric values, but interpretable Strings
    switch (input) {
      case ERenderjobStatus.UPLOADING:
        return 'UPLOADING'

      case ERenderjobStatus.UPLOADED:
        return 'UPLOADED'

      case ERenderjobStatus.SUBMITTING:
        return 'SUBMITTING'

      case ERenderjobStatus.PRERENDER:
        return 'PRERENDER'

      case ERenderjobStatus.PREVIEWS:
        return 'PREVIEWS'

      case ERenderjobStatus.RENDERING:
        return 'RENDERING'

      case ERenderjobStatus.POSTRENDER:
        return 'POSTRENDER'

      case ERenderjobStatus.FINISHED:
        return 'FINISHED'

      case ERenderjobStatus.PREPARINGDOWNLOAD:
        return 'PREPARINGDOWNLOAD'

      case ERenderjobStatus.DOWNLOADABLE:
        return 'DOWNLOADABLE'

      case ERenderjobStatus.DISABLED:
        return 'DISABLED'

      case ERenderjobStatus.ERROR:
        return 'ERROR'

      default:
        return 'UNDEFINED'
    }
  }
}
