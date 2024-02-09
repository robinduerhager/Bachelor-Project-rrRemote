import { AMQP } from "../../interfaces/amqp"
import { renderjobRemoteRepo, renderjobLocalRepo } from "../../infrastructure"
import { Renderjob } from "../../domain/renderjob/renderjob"
import { PathingService } from "../../domain/pathing/pathingService"
import { resolveXML } from "../../utils/xml"
import { RRRemoteError } from "../../utils/rrremoteError"
import logger from "../../utils/logger"
import { ERenderjobStatus } from "../../utils/types"

/**
 * @description If a Renderjob should be submitted, The File Service should download the Renderjob ZIP file from MinIO and unzip it to the local filestorage. After that, it should resolve the submit XML File and publish an Event to RabbitMQ, that the Renderjob is ready to be processed further.
 * @param amqpClient The initialized RabbitMQClient
 */
export const CreateOnRenderjobSubmitWorker = async (amqpClient: AMQP) => {
  //TODO this should be an RPC call, because if one of the checks before the fetchFilesOf() method fails, we could send back an Error
  amqpClient.addListener({
    topic: 'Renderjob',
    category: 'submit',
    action: 'requested'
  }, async msg => {
    if (!msg)
      throw new Error('Unable to get Renderjob Files')

      const convertedMsg = JSON.parse(msg.content.toString())

      if(!convertedMsg.artistID || !convertedMsg.renderjobID){
        throw new Error('Unable to get Renderjob Files')
      }

      const {
        artistID,
        renderjobID
      } = convertedMsg

      logger.info('Trying to submit Renderjob...', {
        artistID,
        renderjobID
      })

      const renderjob = Renderjob.createOneWith(renderjobID, artistID)
      const rExistsRemote = await renderjobRemoteRepo.exists({
        artistID: renderjob.artist.id.toValue(),
        renderjobID: renderjob.id.toValue()
      })

      if (!rExistsRemote){
        amqpClient.publishEvent({
          topic: 'Renderjob',
          category: 'status',
          action: 'update'
        },
        {
          initiator: amqpClient.serviceName,
          artistID,
          renderjobID,
          status: ERenderjobStatus.ERROR.valueOf()
        })
        throw new RRRemoteError('Unable to fetch Renderjob from RemoteRepo', artistID, renderjobID)
      }
        

      const rExistsLocal = await renderjobLocalRepo.exists({
        artistID: renderjob.artist.id.toValue(),
        renderjobID: renderjob.id.toValue() + '.zip'
      })

      //NOTE Maybe it would be better here, to check in RR if such a project already exists
      if (rExistsLocal){
        amqpClient.publishEvent({
          topic: 'Renderjob',
          category: 'status',
          action: 'update'
        },
        {
          initiator: amqpClient.serviceName,
          artistID,
          renderjobID,
          status: ERenderjobStatus.ERROR.valueOf()
        })
        throw new RRRemoteError('Renderjob already exists on Storage', artistID, renderjobID)
      }
        
        // This should not return a new Promise and work with the await keyword
        // rejections can be also used with Promise.reject()
        return new Promise((resolve, reject) => {
          // Download the Renderjob ZIP to the local filesystem
          renderjobRemoteRepo.fetchFilesOf(renderjob)
          // If done...
          .then(val => {
            // resolve the submitXML -> replace all pattern occurences in the XML with the right Renderjob path
            resolveXML(artistID, renderjobID)
              .catch(err => {
                if (err)
                  return reject(err)
              })
              // If done...
              .then(resolved => {
                if (!resolved)
                  return reject('Unable to resolve XML of Renderjob: ' + renderjobID)

                  // Publish the message, that the Renderjob transition from MinIO to the local filesystem has been successfull
                if (!amqpClient.publishEvent({
                  topic: 'Renderjob',
                  category: 'transition',
                  action: 'finished'
                }, {
                  renderjobBasePath: renderjob.path.local.value,
                  relativeFilePaths: val,
                  artistID: renderjob.artist.id.toValue(),
                  renderjobID: renderjob.id.toValue(),
                  rrPath: PathingService.retrieveRRPath()
                }))
                  return reject('Unable to publish Event to other Service')
                
                amqpClient.acknowledge(msg)
                logger.info('Renderjob submit successfull', {
                  artistID: renderjob.artist.id.toValue(),
                  renderjobID: renderjob.id.toValue(),
                })
                return resolve(val)
              })
          })
          .catch(err => {
            amqpClient.publishEvent({
              topic: 'Renderjob',
              category: 'status',
              action: 'update'
            },
            {
              initiator: amqpClient.serviceName,
              artistID,
              renderjobID,
              status: ERenderjobStatus.ERROR.valueOf()
            })
            logger.error('Error occured while downloading Files from MinIO', {
              err,
              artistID,
              renderjobID
            })
          })
        })
          .catch(err => {
            amqpClient.publishEvent({
              topic: 'Renderjob',
              category: 'status',
              action: 'update'
            },
            {
              initiator: amqpClient.serviceName,
              artistID,
              renderjobID,
              status: ERenderjobStatus.ERROR.valueOf()
            })
            logger.error('Error occured during XML Operations', {
              err,
              // Not sure if these variables can be used here
              artistID: artistID ? artistID : undefined,
              renderjobID: renderjobID ? renderjobID : undefined
            })
          })
  })
}