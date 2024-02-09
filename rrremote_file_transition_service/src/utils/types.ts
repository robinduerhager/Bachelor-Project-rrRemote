// Quelle: https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist/49725198#49725198
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>>
    & {
        [K in Keys]-?:
            Required<Pick<T, K>>
            & Partial<Record<Exclude<Keys, K>, undefined>>
    }[Keys]

// Quelle: https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist/49725198#49725198
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> 
    & {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
    }[Keys]

// Quelle: https://stackoverflow.com/questions/43159887/make-a-single-property-optional-in-typescript
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Quelle: https://github.com/stemmlerjs/white-label/blob/master/src/core/infra/Repo.ts
export interface Repo<T> {
  exists(record: T | any): Promise<boolean>
}

// Quelle: https://github.com/stemmlerjs/white-label/blob/master/src/core/infra/Mapper.ts
export interface Mapper<DomainType, DTOType> {
  toDomain(raw: any): Promise<DomainType>
  toDB(entity: DomainType): Promise<any>
  toDTO(entity: DomainType): Promise<DTOType>
}

export enum ERRrenderjobStatusValues {
  sNone = 0,
  sFirstCheck = 20,
  sWaitForJobs = 40,
  sScriptPreRender = 60,
  sPreviewRender = 80,
  sScriptAfterPreview = 90,
  sWaitForApprovalMain = 100,
  sWaitForJobsAfterPreview = 110,
  sMainRender = 120,
  sScriptPostRender = 140,
  sWaitForApprovalDone = 160,
  sScriptFinished = 180,
  sFinished = 200,
}

export enum ERenderjobStatus {
  UPLOADING = 300,
  UPLOADED = 301,
  SUBMITTING = 302,
  PRERENDER = 303,
  PREVIEWS = 304,
  RENDERING = 305,
  POSTRENDER = 306,
  FINISHED = 307,
  PREPARINGDOWNLOAD = 308,
  DOWNLOADABLE = 309,
  DISABLED = 310,
  ERROR = 311
}