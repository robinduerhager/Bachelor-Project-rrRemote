import { ApolloServer } from 'apollo-server-express'
import { buildFederatedSchema } from '@apollo/federation'
import express, { Response, Request } from 'express'

// Custom Imports
import resolvers from '../../app/resolvers'
import typeDefs from '../graphql/schema.graphql'
import { artistRepo } from '../../infrastructure'

// Type Imports
import { ArtistRepo } from '../../infrastructure/repos/artist/artistRepo'
import logger from '../../utils/logger'

export interface Context {
  req: Request
  res: Response
  artistRepo: ArtistRepo
}

/**
 * @description Initializes the Apollo-Express-Server-2 for the rrRemote Artist Service
 * @param port The Port which should be used if no PORT env Variable was found
 * @returns An Apollo-Express-Server-2 instance
 */
export const initApp = async (port: number): Promise<ApolloServer> => {
  logger.info('Initializing Artist Service...')
  
  // The Port of the File Service will be set by the PORT environment Variable of the Server/Gitlab Runner.
  // If the PORT environment Variable is not set, the parameter 'port' will be used instead
  const PORT = process.env.PORT || port
  const expressApp = express()

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
        artistRepo: artistRepo
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
        `Service listening at http://rrremoteauthentication:${PORT}${apolloServer.graphqlPath}`
      )
  })

  return apolloServer
}