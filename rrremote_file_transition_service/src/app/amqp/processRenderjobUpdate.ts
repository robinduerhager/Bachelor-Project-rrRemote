import fs from 'fs-extra'
import path from 'path'
import { AMQP } from '../../interfaces/amqp'
import {
//  renderjobRemoteRepo,
//  renderjobLocalRepo,
  minioClient
} from '../../infrastructure'
//import { Renderjob } from '../../domain/renderjob/renderjob'
import { PathingService } from '../../domain/pathing/pathingService'
import { ZIP } from '../../utils/ZIP'
import { ERenderjobStatus, ERRrenderjobStatusValues } from '../../utils/types'
import { RRRemoteError } from '../../utils/rrremoteError'
import logger from '../../utils/logger'
import { ItemBucketMetadata } from 'minio'

/**
 * @description This Consumer gets triggered if a Renderjobstatus should be updated. If the new Renderjobstatus is FINISHED, it will start zipping the Renderings and upload them to MinIO. Besides that, this process will send messages to RabbitMQ, with which other Services should update their Renderjob Domain objects (e.g. Firebase should update its Renderjobstatus aswell)
 * @param amqpClient The initialized RabbitMQClient
 */
export const CreateOnRenderjobUpdateWorker = async (amqpClient: AMQP) => {
  amqpClient.addListener(
    {
      topic: 'Renderjob',
      category: 'status',
      action: 'update'
    },
    async msg => {
      if (!msg) throw new Error('Unable to get Renderjob Files')

      amqpClient.acknowledge(msg)
      const convertedMsg = JSON.parse(msg.content.toString())

      if (!convertedMsg) throw new Error('Unable to get Renderjob Files')
      if (convertedMsg.initiator && convertedMsg.initiator === 'FILES') return
      if (
        !convertedMsg.artistID ||
        !convertedMsg.renderjobID ||
        !convertedMsg.status
      )
        throw new Error('Unable to get Renderjob Files')

      console.log('Renderjobstatus Type: ' + convertedMsg.status)

      const { artistID, renderjobID } = convertedMsg
      const status = parseInt(convertedMsg.status)
      
      logger.info('Evaluating Renderjobstatus update', {
        artistID,
        renderjobID,
        status
      })

      // If the Renderjobstatus is FINISHED, we can ZIP and upload the Renderings of the Renderjob
      if (status === 200) {
        if (!convertedMsg.imgdirPart)
          throw new RRRemoteError('Unable to get Renderjob Files', convertedMsg.artistID, convertedMsg.renderjobID)

          logger.info('Setting up Renderjobstatus update to PREPARINGDOWNLOAD', {
            artistID,
            renderjobID
          })

        // Publish a Renderjobstatus update message to RabbitMQ, so services like the Renderjob Services can update their Database with the new specified Renderjobstatus below
        amqpClient.publishEvent(
          {
            topic: 'Renderjob',
            category: 'status',
            action: 'update'
          },
          {
            initiator: amqpClient.serviceName,
            artistID,
            renderjobID,
            status: ERenderjobStatus.PREPARINGDOWNLOAD.valueOf()
          }
        )

        logger.info('Renderjobstatus update to PREPARINGDOWNLOAD Send', {
          artistID,
          renderjobID
        })

        const { imgdirPart } = convertedMsg

        // The imgDirPart looks like this: /images/ when currently retrieved by Royal Renders updateRRRemote python Script, so we have to remove the slashes to concatenate it to other paths
        const modImgDirPart = PathingService.removeAnySlash(imgdirPart)

        // The basePath is the absolute Path to the Renderjob
        // E.g.: it can be <PathToIFSFolder>/_IFS/PROD/<ArtistID>/<RenderjobID>
        // We can concatenate the modImgDirPart to the basePath to get the actual imgDir absolute Path where the Renderings are stored
        const basePath = PathingService.retrieveLocalPathWith(
          artistID,
          renderjobID
        )

        // Here happens the concatenation of the basePath and modImgDirPart
        // The path also gets resolved to evade unexpected behaviour
        const imgDir = path.resolve(path.join(basePath, modImgDirPart))
        if (!fs.pathExistsSync(imgDir))
          throw new RRRemoteError('Unable to ZIP Renderings', artistID, renderjobID)

        // ZIP the Renderings and return the path to the newly created ZIP
        const zipPath = await ZIP.compress(renderjobID, basePath, imgDir)
          .catch(err => {
            logger.error('Unable to ZIP Renderings', {
              err,
              artistID,
              renderjobID
            })
          })

        if (!zipPath)
          throw new RRRemoteError('void ZipPath for zipped Renderings', artistID, renderjobID)

        const zipStream = fs.createReadStream(zipPath)

        // Upload the newly created ZIP to MinIO, where it can be downloaded by the Frontend
        const success = await minioClient.putObject(
          artistID.toLowerCase(),
          path.basename(zipPath),
          zipStream
        )

        if (success){
          logger.info('Setting up Renderjobstatus update to DOWNLOADABLE', {
            artistID,
            renderjobID
          })

          // Publish a Renderjobstatus update message to RabbitMQ, so services like the Renderjob Services can update their Database with the new specified Renderjobstatus below
          amqpClient.publishEvent(
            {
              topic: 'Renderjob',
              category: 'status',
              action: 'update'
            },
            {
              initiator: amqpClient.serviceName,
              artistID,
              renderjobID,
              status: ERenderjobStatus.DOWNLOADABLE.valueOf()
            }
            )
            logger.info('Renderjobstatus update to DOWNLOADABLE Send', {
              artistID,
              renderjobID
            })
          }
      }
      return
    }
  )
}
