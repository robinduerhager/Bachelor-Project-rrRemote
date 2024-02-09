// Quelle: https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist/49725198#49725198
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>>
    & {
        [K in Keys]-?:
            Required<Pick<T, K>>
            & Partial<Record<Exclude<Keys, K>, undefined>>
    }[Keys]

// Quelle: https://github.com/stemmlerjs/white-label/blob/master/src/core/infra/Repo.ts
export interface Repo<T> {
  exists(record: T | any): Promise<boolean>
  findBy(input: any): Promise<T>
}

// Quelle: https://github.com/stemmlerjs/white-label/blob/master/src/core/infra/Mapper.ts
export interface Mapper<DomainType, DTOType> {
  toDomain(raw: any): Promise<DomainType>
  toDB(entity: DomainType): Promise<any>
  toDTO(entity: DomainType): Promise<DTOType>
}