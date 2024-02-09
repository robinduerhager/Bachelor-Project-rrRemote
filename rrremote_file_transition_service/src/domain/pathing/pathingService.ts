import path from 'path'
import fs from 'fs-extra'

export class PathingService {
  private constructor() {}

  /**
   * @param artistID The ArtistID which is associated with the User Folder respectively, extracted to the RRPROJECTS Folder
   * @param renderjobID The RenderjobID which is associated with the Renderjob Folder
   * @param os The os for which the path should be concat
   */
  public static retrieveLocalPathWith(
    artistID: string,
    renderjobID: string,
    os?: NodeJS.Platform
  ): string {
    if (!os) os = process.platform

    let base = ''

    if (os === 'linux')
      base = path.resolve(
        path.join(
          '/',
          'mnt',
          'RRPROJECTS',
          process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'
        )
      )

    if (os === 'win32')
      base = path.resolve(
        path.join(
          '//<ROYAL RENDER IP>',
          'student',
          '_IFS',
          process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'
        )
      )
      // Ensure that the artist local Bucket/Folder exists before streaming into it
      fs.ensureDir(path.join(base, artistID))
    return path.join(base, artistID, renderjobID)
  }

  /**
   * @description specifies the MinIO specific S3 Path for the Renderjob in question
   * @param artistID The requesting ArtistID
   * @param renderjobID The RenderjobID for whom a Remote MinIO path should be retrieved for
   * @returns A S3-compatible bucket/object Path for the MinIO instance
   */
  public static retrieveRemotePathWith(
    artistID: string,
    renderjobID: string
  ): string {
    return path.join(artistID, renderjobID) + '.zip'
  }

  /**
   * @description concatenates the Path to the rrSubmitterconsole 
   * @param os optional Parameter for retrieving a specific rrSubmitterconsole path, other than the current os on which the process is running on
   * @returns The path to the rrSubmitterconsole
   * @throws Will throw an Error if the os something differen than linux or windows
   */
  public static retrieveRRPath(os?: NodeJS.Platform): string {
    os = os ? os : process.platform

    if (os === 'linux')
      return path.resolve(
        path.join('/', 'mnt', 'RR', 'bin', 'lx64', 'rrSubmitterconsole')
      )

    if (os === 'win32')
      return path.resolve(
        path.join('//<ROYAL RENDER IP>', 'rr', 'bin', 'win64', 'rrSubmitterconsole')
      )

    throw new Error('Could not resolve OS')
  }

  /**
   * @description Removes Trailing os Slashes from an input path
   * @param input The path which has trailing os Slashes that should be removed
   * @returns A modified Path without any trailing os Slashes
   */
  public static removeTrailingSlash(input: string) {
    return input.replace(/[\/|\\]+$/, '')
  }

  /**
   * @description Removes any Slash from a String
   * @param input The path which has Slashes that should be removed
   * @returns A modified String without any slashes
   */
  public static removeAnySlash(input: string) {
    return input.replace(/[\/|\\]+/g, '')
  }

  /**
   * @description Adds an os-specific trailing slash to the string, except it already has a trailing slash
   * @param input The path on which a trailing slash should be ensured
   * @returns A modified path with an ensured trailing slash
   * @throws Will throw an Error if the os is something different than linux or windows
   */
  public static ensureTrailingSlash(input: string) {
    const os = process.platform
    let regex: RegExp
    if (os === 'linux') regex = /\/+$/
    else if (os === 'win32') regex = /\\+$/
    else throw new Error('Could not resolve OS')

    if (regex.test(input)) return input

    return path.join(input, path.sep)
  }
}
