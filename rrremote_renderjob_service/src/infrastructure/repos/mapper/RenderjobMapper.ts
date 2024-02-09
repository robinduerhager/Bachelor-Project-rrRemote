import { DRenderjob } from "../../../domain"
import { StatusMapper } from "./"
import { DTORenderjob } from "../../../utils/types"

export class RenderjobMapper {
  /**
   * @description Converts a DBRenderjob to a DTO-/GraphQL-ready Renderjob
   * @param repoRenderjob The DBRenderjob/RepoRenderjob which should be converted to a DTO-/GraphQL-ready Renderjob
   * @returns The same Renderjob in a DTO-/GraphQL-ready format
   */
  public static toDTO(repoRenderjob: DRenderjob): DTORenderjob {
    // The DTO Format of a Renderjob can be extracted from the schema.graphql File
      return {
        id: repoRenderjob.id.toValue(),
        artist: repoRenderjob.artist.id.toValue(),
        title: repoRenderjob.title,
        status: StatusMapper.statusToString(repoRenderjob.status.renderjobStatus),
        remainingTime: repoRenderjob.remainingRenderTime
      }
  }

  /**
   * @description Converts a DBRenderjob List to a DTO-/GraphQL-ready Renderjob List
   * @param repoRenderjobs The DBRenderjob/RepoRenderjob List which should be converted to a DTO-/GraphQL-ready Renderjob List
   * @returns The same Renderjob List in a DTO-/GraphQL-ready format
   */
  public static toDTOArr(repoRenderjobs: DRenderjob[]): DTORenderjob[]{
    let renderjobs = []

    // For each Renderjob in the List, call the toDTO method and save that result in a new Array
    repoRenderjobs.forEach(renderjob => {
      renderjobs.push(RenderjobMapper.toDTO(renderjob))
    })

    return renderjobs
  }
}