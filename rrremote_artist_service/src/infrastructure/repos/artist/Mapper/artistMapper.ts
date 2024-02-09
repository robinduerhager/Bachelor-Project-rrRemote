import { Mapper } from "../../../../utils/types";
import { DArtist, Artist } from "../../../../domain";
import { auth } from "firebase-admin";

/**
 * @description Should map raw Database data to the Artist Domainobject.
 */
export class ArtistMapper implements Mapper<DArtist, Artist> {

  /**
   * @description Maps the values of an Artist database entry to an Artist Domainobject.
   * @param raw The raw database Artist object which should be converted to an Artist Domainobject.
   * @returns An Artist Domainobject.
   */
  async toDomain(raw: any): Promise<DArtist> {
    const {
      uid,
      email
    } = raw

    const dArtist = DArtist.createDArtist(uid, email)

    return dArtist
  }
  
  /**
   * @description Maps the values of an Artist Entity to an Artist database schema.
   * @param EntityOrValueObject The Artist Entity which should be mapped to a database schema.
   * @returns The DB Ready Artist Object which can be directly stored to the Database (currently a normal User without __typename).
   */
  async toDB(entity: DArtist): Promise<Pick<Artist, "email" | "uid">> {
    const {
      id,
      email
    } = entity

    return ({
      uid: id.toValue(),
      email: email.props.name
    })
  }

  /**
   * @description Maps the values of an DArtist Entity to an Artist DTO / GQL schema ready Object.
   * @param entity The Domainobject which should be transferred to a DTO (here GQL ready Artist).
   * @returns The GQL Ready Artist Object which can be accessed through a GraphQL-Client
   */
  async toDTO(entity: DArtist): Promise<Artist> {
    const {
      id,
      email
    } = entity

    return ({
      uid: id.toValue(),
      email: email.props.name
    })
  }
}