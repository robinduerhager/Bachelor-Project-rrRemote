import { Context } from '../../../../../interfaces/server/server'
import { ERenderjobStatus } from '../../../../../domain'
import logger from '../../../../../utils/logger'
import { RRRemoteError } from '../../../../../utils/rrremoteError'

export const createRenderjob = async (
  parent,
  { title },
  { req, res, amqpClient, firestore }: Context,
  info
): Promise<Storage> => {
  logger.info('CreateRenderjob triggered')
  let artistID = req.headers.artistid
  if (!artistID) throw new Error('Unauthorized')
  if (Array.isArray(artistID)) artistID = artistID[0]

  // Adding a new Renderjob entry to Firebase Firestore
  logger.info('Trying to create a Renderjob entry in Firestore', {
    artistID
  })
  const doc = await firestore.collection('renderjobs').doc()
  await doc.set({
    artist: artistID,
    title,
    status: ERenderjobStatus.UPLOADING,
    createdAt: new Date(Date.now())
  })
  const renderjobID = doc.id

  // Letting the File Service know, that a new Renderjob was created, so that it creates some Storage space for it (like the right user bucket, etc.)
  logger.info(
    'Sending a Renderjob upload requested RPC call, so the File service will generate the specific storage space',
    {
      artistID,
      renderjobID
    }
  )
  const replyMsg = await amqpClient.sendRPCMessage(
    {
      topic: 'Renderjob',
      category: 'upload',
      action: 'requested'
    },
    {
      artistID,
      renderjobID
    }
  )
  if (!replyMsg)
    throw new RRRemoteError(
      'RPC Storage space replyMsg is undefined',
      artistID,
      renderjobID
    )

  const result = JSON.parse(replyMsg.toString())
  if (!result)
    throw new RRRemoteError(
      'RPC Storage space replyMsg could not be converted',
      artistID,
      renderjobID
    )

  logger.info('CreateRenderjob operation success', {
    artistID,
    renderjobID
  })
  return result
}
