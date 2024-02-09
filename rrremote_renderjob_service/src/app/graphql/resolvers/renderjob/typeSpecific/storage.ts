import { Context } from "../../../../../interfaces/server/server"

// This Resolver adds the ability for a Storage to also directly send back the RenderjobID as a String. This was requested by the Frontend

export const renderjobID = async (
  parent,
  args,
  { req, res, amqpClient, firestore, renderjobRepo }: Context,
  info
): Promise<string> => {
    const fileName: string = parent.fileName
    return fileName.split('.zip')[0]
}