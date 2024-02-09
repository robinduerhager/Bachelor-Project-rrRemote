import archiver from 'archiver'
import extract from 'extract-zip'
import fs from 'fs-extra'
import path from 'path'
import { PathingService } from '../domain/pathing/pathingService'
import logger from './logger'

export class ZIP {

  /**
   * @description ZIPs the Renderings of a finished Renderjob
   * @param renderjobID The renderjobID of the Renderjob which has been finished
   * @param basePath The basePath, containing the absolute path, including the artistID
   * @param imgDir The imgDir part, which can be concatenated to basepath/renderjobID/imgDir, which holds the Renderings
   * @returns The Path to the Renderings ZIP
   */
  public static async compress(renderjobID: string, basePath: string, imgDir: string): Promise<string> {
    logger.info('Beginning ZIP of Renderings', {
      renderjobID
    })
    const imgDirWSlash = PathingService.ensureTrailingSlash(imgDir)

    // The basePath + renderjobID + _RENDERINGS.zip will be the respective renderjob Renderings archive which should be uploaded
    const outputPath = path.join(basePath, renderjobID.concat('_RENDERINGS', '.zip'))
    const output = fs.createWriteStream(outputPath)

    const archive = archiver('zip', {
      // Setting compression level
      zlib: { level: 9 }
    })

    output.on('close', function() {
      logger.info('archiver has been finalized and the output file descriptor has closed', {
        renderjobID,
        totalBytes: archive.pointer() + ' total bytes'
      })
    });

    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        logger.warn('archiver warning occured', {
          err
        })
      } else {
        throw err;
      }
    });

    archive.on('error', err => {
      if (err) throw err
    })

    // Open the writeStream and pipe incoming data straight to it
    archive.pipe(output)
    
    // Include the imageDirectory with all Renderings
    archive.directory(imgDirWSlash, false, (data) => {
      return data
    })

    await archive.finalize()
    
    // Return the Path of the generated ZIP file
    return path.resolve(output.path.toString())
  }

  /**
   * @description unzips a ZIP archive to the specified path. It can throw an Error, e.g. by including too many chunks into the memory, etc.
   * @param from The Path of the ZIP which should be extracted
   * @param to The Path to which the ZIP contents should be extracted to
   * @returns A list of all relative paths which are part of the zip
   */
  public static async uncompress(from: string, to: string): Promise<string[]> {
    let relativePaths = []
    return new Promise((resolve, reject) => {
      extract(
        from,
        {
          dir: to,
          onEntry: (entry, zipFile) => {
            // Save all the relative paths which were extracted to the array, which will be send to the renderjob Service
            // Else the renderjob Service has to have access to the File System, to validate Files with the Rule System
            // Based on the Single-Responsibility Principle, this shouldn't be the case and the File Service should take this responsibility
            relativePaths.push(entry.fileName)
          }
        },
        err => {
          if (err) reject(err)

          resolve(relativePaths)
        }
      )
    })
  }
}
