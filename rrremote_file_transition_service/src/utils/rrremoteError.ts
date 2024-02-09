export interface RRRemoteErrorProps extends Error {
  artistID: string
  renderjobID: string
}

export class RRRemoteError extends Error implements RRRemoteErrorProps {
  public artistID: string
  public renderjobID: string

  constructor(message: string, artistID: string, renderjobID: string){
    super(message)
    this.name = 'RRRemoteError'
    this.artistID = artistID
    this.renderjobID = renderjobID
    Error.captureStackTrace(this, this.constructor)
  }
}