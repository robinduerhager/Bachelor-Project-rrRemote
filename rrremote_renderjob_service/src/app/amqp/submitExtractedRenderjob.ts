import { AMQP } from '../../interfaces/amqp'
import { MayaRule } from '../../domain/rule'
import { RRCommandService, DRenderjob, ERenderjobStatus } from '../../domain'
import logger from '../../utils/logger'
import { RRRemoteError } from '../../utils/rrremoteError'
import { renderjobRepo } from '../../infrastructure'

/**
 * @description Validates incoming relative Paths of the Renderjob, generates a Royal Render Renderjob submit command and sends an RPC to the submit proxy, which actually uses the submit command to submit the Renderjob on the Filesystem
 * @param amqpClient The generated amqpClient
 */
export const createSubmitRenderjobWorker = async (amqpClient: AMQP) => {
  amqpClient.addListener(
    {
      topic: 'Renderjob',
      category: 'transition',
      action: 'finished'
    },
    async msg => {
      logger.info('Renderjob submit triggered')
      if (!msg) throw new Error('Unable to submit Renderjob')
      amqpClient.acknowledge(msg)

      const convertedMsg = JSON.parse(msg.content.toString())
      console.log(convertedMsg)

      if (
        !convertedMsg.relativeFilePaths ||
        !convertedMsg.renderjobBasePath ||
        !convertedMsg.artistID ||
        !convertedMsg.renderjobID ||
        !convertedMsg.rrPath
      )
        throw new Error('Renderjob Input is missing')

      // The converted Message will include various parameters for proceeding
      // The relativeFilePaths variable is a list with all paths that exist for this specific Renderjob, so the Renderjob Service don't need to use the fs-extra module (which also doesn't work on NodeJS 6, which is needed for the RR modules)
      const {
        relativeFilePaths,
        renderjobBasePath, // Since a windows submit proxy service is actually submitting, we don't need this linux based scene base path
        artistID,
        renderjobID,
        rrPath // for linux submit, however, linux can't submit since alpine is compiled with musl and not with glibc...
      } = convertedMsg

      // Validate the relativeFilePaths with the Maya Ruleset, which defines folders and files which are necessary in the projectstructure for Royal Render
      let xmlPath = ''
      try{
        xmlPath = new MayaRule().validate(relativeFilePaths)
      } catch (e) {
        renderjobRepo.findBy({
          renderjobID
        })
        .then(val => {
          const renderjob: DRenderjob = Array.isArray(val) ? val[0] : val
          renderjob.update(
            undefined,
            {
              fbRenderjobStatus: ERenderjobStatus.ERROR.valueOf()
            }
          )
        })
      }
      if (!xmlPath)
        throw new RRRemoteError(
          'No XML found in the Renderjob',
          artistID,
          renderjobID
        )

      // If the Maya Ruleset validated the filepaths, we can generate a rrSubmitterconsole submit string, which includes the path to the XML, the artistID as a Username and the renderjobID as the CompanyProjectName
      const rrCommand = RRCommandService.generateCommand(
        xmlPath,
        artistID,
        renderjobID
      )

      // We then send an RPC message to the submitter proxy, since the submit of a Renderjob will just take a few seconds
      // With the RPC, we can then fetch error codes or stdout output from the submitter proxy and inspect and handle those errors without touching the proxy submit
      // That is a more efficient and elegant way, since the proxy submit service is runnin on windows service and does not include any automated installation like gitlab-ci (there are no gitlab runners on the windows server, and that system should stay as clean as possible)
      logger.info(
        'Sending final submit Renderjob RPC Call with RRCommand to submit proxy',
        {
          renderjobID,
          artistID,
          rrCommand
        }
      )
      const replyMsg = await amqpClient.sendRPCMessage(
        {
          topic: 'Renderjob',
          category: 'submit',
          action: 'send'
        },
        {
          commandOptions: rrCommand
        }
      )

      if (!replyMsg)
        throw new RRRemoteError(
          'Renderjob submit send RPC callback undefined',
          artistID,
          renderjobID
        )

      const result = JSON.parse(replyMsg.toString())
      if (!result)
        throw new RRRemoteError(
          'Renderjob submit send RPC callback empty',
          artistID,
          renderjobID
        )

      // If there are errors, we will use these to throw a new Error in our system, which we can handle more gracefully
      if (result.err || result.stderr) {
        if (result.stderr)
          throw new RRRemoteError(
            'Unable to submit Renderjob: ' + result.err
              ? JSON.stringify(result.err, undefined, 2) + '||' + result.stderr
              : JSON.stringify(result.stderr, undefined, 2),
            artistID,
            renderjobID
          )
        throw new RRRemoteError(
          'Unable to submit Renderjob: ' +
            JSON.stringify(result.err, undefined, 2),
          artistID,
          renderjobID
        )
      }

      // stdout should also be logged, since it can also include warnings or info about the submitted Renderjob
      // It's also a good way to humanly validate, that a Renderjob got submitted
      if (result.stdout) logger.info(`Submit proxy output: ${result.stdout}`)

      logger.info('Submit Renderjob success', {
        renderjobID,
        artistID
      })
      return true
    }
  )
}
