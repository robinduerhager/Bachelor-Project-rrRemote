import { ApolloServer } from 'apollo-server-express'
import { buildFederatedSchema } from '@apollo/federation'
import express, { Response, Request } from 'express'

// Custom Imports
import resolvers from '../../app/graphql/resolvers'
import typeDefs from '../graphql/schema.graphql'
import { renderjobLocalRepo, renderjobRemoteRepo } from '../../infrastructure'

// Type Imports
import { RenderjobRemoteRepo } from '../../infrastructure/repos/renderjob/renderjobRemoteRepo'
import { RenderjobLocalRepo } from '../../infrastructure/repos/renderjob/renderjobLocalRepo'
import { AMQP } from '../amqp'
import { initAllAMQPWorker } from '../../app/amqp'
import logger from '../../utils/logger'

export interface Context {
  req: Request
  res: Response
  renderjobLocalRepo: RenderjobLocalRepo
  renderjobRemoteRepo: RenderjobRemoteRepo
  amqpClient: AMQP
}

/**
 * @description Initializes the Apollo-Express-Server-2 for the rrRemote File-Transition Service
 * @param port The Port which should be used if no PORT env Variable was found
 * @returns An Apollo-Express-Server-2 instance
 */
export const initApp = async (port: number): Promise<ApolloServer> => {
  logger.info('Initializing...')

  // The Port of the File Service will be set by the PORT environment Variable of the Server/Gitlab Runner.
  // If the PORT environment Variable is not set, the parameter 'port' will be used instead
  const PORT = process.env.PORT || port
  const expressApp = express()

  // Create an amqpClient, which will connect to the given RabbitMQ Instance
  const amqpClient = await AMQP.createClient({
    username:
      process.env.NODE_ENV === 'production'
        ? process.env.RABBITMQ_DEFAULT_USER
        : 'rabbitmq',
    secret:
      process.env.NODE_ENV === 'production'
        ? process.env.RABBITMQ_DEFAULT_PASS
        : 'rabbitmq',
    domain: process.env.NODE_ENV === 'production' ? 'rabbitmq' : 'localhost',
    port: 5672,
    rpcQueue: 'renderjob.transition.reply-to',
    serviceName: 'File'
  })

  // After connecting to the RabbitMQ Instance, initialize all AMQP Consumers/Endpoints
  await initAllAMQPWorker(amqpClient).catch(err => {
    logger.error('Unable to initialize AMQP Workers', {
      err
    })
  })

  // Create an ApolloServer Instance, which will take the federated GraphQL-Schema, saved in the interfaces/graphql/schema.graphql file
  // It also takes all resolvers from app/graphql/resolvers and connects those to the GraphQL-Schema Operations respectively
  const apolloServer = new ApolloServer({
    schema: buildFederatedSchema([
      {
        typeDefs,
        resolvers
      }
    ]),
    // The context Function will be passed to each GraphQL-Resolver
    // Therefore, we can use the returned objects, mentions below
    context({ req, res }): Context {
      return {
        req,
        res,
        renderjobLocalRepo,
        renderjobRemoteRepo,
        amqpClient
      }
    },
    // subscriptions don't work with Apollo Federation right now
    // uploads don't work properly in the current Version of Apollo Gateway -> Apollo Gateway has to resolve the upload stream, instead of forwarding this to the respective Microservice
    subscriptions: false,
    uploads: false
  })

  apolloServer.applyMiddleware({ app: expressApp })

  // Start the ApolloServer
  expressApp.listen({ port: PORT }, () => {
    if (process.env.NODE_ENV !== 'production')
      logger.info(
        `Service listening at http://localhost:${PORT}${apolloServer.graphqlPath}`
      )
    else
      logger.info(
        `Service listening at http://rrremoteprojecttransition:${PORT}${apolloServer.graphqlPath}`
      )
  })

  return apolloServer
}
