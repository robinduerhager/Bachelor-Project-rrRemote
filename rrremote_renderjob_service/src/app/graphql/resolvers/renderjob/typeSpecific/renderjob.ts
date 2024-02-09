import { Context } from "../../../../../interfaces/server/server"

// These Resolvers are just referencing other types from other Services
// Those References will get send to other services and resolved there
// The References are based on a __typename, to identify the GraphQL-type, which should be resolved, and the primary Key, specified by the Apollo Federation annotation @key (see graphql.schema)

export const artist = async (
  parent,
  args,
  { req, res, amqpClient, firestore }: Context,
  info
): Promise<any> => {
  return {__typename: 'Artist', uid: parent.artist}
}

export const storage = async (
  parent,
  args,
  { req, res, amqpClient, firestore }: Context,
  info
): Promise<any> => {
  return { __typename: 'Storage', bucketName: parent.artist.toLowerCase(), fileName: parent.id + '.zip' }
}