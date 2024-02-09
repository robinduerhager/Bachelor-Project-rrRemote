import { Context } from "../../../../../interfaces";
import { Renderjob } from "../../../../../domain/renderjob/renderjob";

export const __resolveReference = async (
  parent,
  { renderjobRemoteRepo }: Context
) => {
  const renderjob = Renderjob.createOneWith(parent.fileName, parent.bucketName)
  console.log(renderjob)
  return {
    bucketName: renderjob.artist.id.toValue(),
    fileName: renderjob.id.toValue() + '.zip'
  }
}