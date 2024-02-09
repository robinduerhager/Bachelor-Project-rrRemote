import { RemoteGraphQLDataSource } from '@apollo/gateway'
import { Context } from '../types'
import logger from '../utils/logger'

// Inspired by: https://www.apollographql.com/docs/apollo-server/federation/implementing/#sharing-context-across-services

class AuthenticatedDataSource extends RemoteGraphQLDataSource {

  // This Method will be called by each Request from the Apollo Gateway
  async willSendRequest({ request, context }) {
    
    // 'token' is a value that is forwarded by the Apollo Server
    // That can be a String or null
    // 'auth' is a Firebase Authentication instance
    const { token, auth }: Context = context

    // This function will be also called by the first GraphQL-Schema poll
    // The token is then null, since the Request comes directly from the Apollo Gateway and not an Artist
    if (!token) return

    // If a token has been set by the Apollo Server that is not null
    // Try to resolve the token with Firebase Auth
    const result = await auth
      .verifyIdToken(token)
      .catch(err => console.error(err))

    if (!result) {
       const err = new Error('Artist is not Authorized')
       logger.error('Artist Authorization has failed', err)
       throw err
    }

    // Save the resolved token in the 'authorization' header
    // Also save the 'artistid' if it could be extracted from the token
    request.http.headers.append('authorization', token)
    request.http.headers.append('artistid', result.uid)

    return
  }
}


export default AuthenticatedDataSource
