import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { ApolloGateway } from '@apollo/gateway'
import AuthenticatedDataSource from '../middleware/AuthenticatedDataSource'
import { auth } from '../middleware/Firebase-Auth'
import { Context } from '../types'
import logger from '../utils/logger'

/* const serviceList = [
  {
    name: 'Artist',
    url: 'http://localhost:6461/graphql'
  },
  {
    name: 'Renderjob',
    url: 'http://localhost:4122/graphql'
  },
  {
    name: 'Files',
    url: 'http://localhost:8080/graphql'
  }
] */

const init = async (options: { port: number }) => {
  logger.info('Initializing Apollo Gateway...')

  //IMPORTANT: Managed Apollo Gateway Graph needs a Service to consume. Else it will only throw Errors
  // Setup the ApolloGateway with a modified Header for all Queries and Mutations
  const gateway = new ApolloGateway({
    /* serviceList, */
    // buildService will be called for each GraphQL-Request
    buildService: ({ name, url }) => {
      return new AuthenticatedDataSource({ url })
    }
  })

  // Create a new ApolloServer instance and inject the ApolloGateway instance
  const server = new ApolloServer({
    gateway,
    // Context object which holds different objects which should be accessible by different Resolvers and functions, like the buildService() function.
    context({ req, res }): Context {
      return {
        req,
        res,
        token: req.headers.authorization ? req.headers.authorization : null,
        auth
      }
    },
    // Subscriptions and uploads currently don't work very well with Apollo Federation and Apollo Gateway
    subscriptions: false,
    uploads: false
  })

  const app = express()
  server.applyMiddleware({
    app,
    cors: {
      credentials: true,
      // This is always the Frontend URL, since that is based on Electron (in a nutshell: it packages a webapplication in a very small browser and starts a minimal Server in the background, running on localhost and port 3002)
      origin: ['http://localhost:3002', 'app://.']
    }
  })

  app.listen({ port: options.port }, () => {
    if (process.env.NODE_ENV !== 'production')
      logger.info(
        `Apollo Gateway listening on http://localhost:${options.port}${server.graphqlPath}`
      )
    else
      logger.info(
        `Apollo Gateway listening on http://graphqlgateway:${options.port}${server.graphqlPath}`
      )
  })
}

export default init
