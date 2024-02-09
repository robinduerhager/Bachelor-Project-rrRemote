import bindings from 'rrbindings'
import { libNodeRR2, Job } from 'rrbindings/types'
import {
  Repo,
  RequireOnlyOne,
  ERRrenderjobStatusValues
} from '../../utils/types'
import { firestore } from '../firebase'
import { DRenderjob, ERenderjobStatus } from '../../domain'

/**
 * @description specifies an object with which Renderjobs can be retrieved from the Repository
 */
export interface RenderjobSearchInput {
  renderjobID: string
  artistID: string
}

interface renderjobRRProps {
  rrIp: string
  rrPort: number
  rrUsername: string
  rrSecret: string
}

interface dbRenderjob {
  id: string
  title: string
  artist: string
  fbStatus: number
  createdAt: Date
}

export class RenderjobRepo implements Repo<DRenderjob> {
  private rrIp: string
  private rrPort: number
  private rrUsername: string
  private rrSecret: string

  private fbModel: FirebaseFirestore.Firestore
  private rrModel: libNodeRR2.rrTCP
  private rrJob: Job.rrJob

  public constructor(props: renderjobRRProps) {
    this.rrIp = props.rrIp
    this.rrPort = props.rrPort
    this.rrUsername = props.rrUsername
    this.rrSecret = props.rrSecret

    this.fbModel = firestore
    this.rrModel = bindings._rrTCP()
    this.rrJob = bindings.createRRJob()

    if (!this.rrModel.setServer(this.rrIp, this.rrPort))
      throw new Error('Unable to connect to RoyalRender')

    this.rrModel.setLogin(this.rrUsername, this.rrSecret)
  }

  /**
   * @description Finds the Renderjobs which are specified by the RenderjobSearchInput in Firebase and Royal Render and merges those into a rrRemote Renderjob Domain object
   * @param input The RenderjobSearchInput which has to be at least a RenderjobID or an ArtistID
   * @returns A Domain Renderjob, if a RenderjobID was provided, or a Domain Renderjob List if an ArtistID was provided
   */
  public async findBy(
    input: RequireOnlyOne<RenderjobSearchInput, 'renderjobID' | 'artistID'>
  ): Promise<DRenderjob | DRenderjob[]> {
    let dbRenderjob: dbRenderjob | dbRenderjob[]
    if (input.renderjobID)
      dbRenderjob = await this.findDbRenderjob({
        renderjobID: input.renderjobID
      })

    if (input.artistID)
      dbRenderjob = await this.findDbRenderjob({
        artistID: input.artistID
      })

    // If we specified a RenderjobID, we will get one Renderjob
    // If an ArtistID was specified, the dbRenderjob variable will be an Array of DBRenderjobs
    if (!dbRenderjob || (Array.isArray(dbRenderjob) && dbRenderjob.length <= 0))
      return []

    // If a RenderjobID was specified, the following codeblock will be used for merging the Royal Render and DB Renderjob
    // Different Methods are needed for a single Renderjob vs a List of Renderjobs
    if (!Array.isArray(dbRenderjob)) {
      // Get a Renderjob from Royal Render and extract some valuable variables from it
      const {
        remainingRenderTime,
        rrStatus,
        disabled,
        renderjobID
      } = await this.findRRRenderjob(input.renderjobID, dbRenderjob.artist)

      // Merge the Royal Render and the DB Renderjob into one Renderjob
      // If Royal Render specifies the Renderjob as disabled, set The fbRenderjobstatus to DISABLED, else continue with the typical Status evaluation process
      return await DRenderjob.createOneWith(
        input.renderjobID,
        dbRenderjob.title,
        dbRenderjob.artist,
        {
          fbRenderjobStatus: disabled
            ? ERenderjobStatus.DISABLED
            : dbRenderjob.fbStatus,
          rrRenderjobStatus: disabled ? undefined : rrStatus
        },
        remainingRenderTime
      )
    }

    // Here starts the part, if dbRenderjobs is an Array
    let rrRenderjobs = []

    // For each Renderjob...
    for (const renderjob of dbRenderjob) {
      // Get a Renderjob from Royal Render and extract some valuable variables from it
      // TODO if we get multiple Renderjobs to update, this could be very ineffective, since Royal Render will be requested for each Renderjob. A bulk method would be probably more efficient
      const {
        remainingRenderTime,
        rrStatus,
        disabled,
        renderjobID
      } = await this.findRRRenderjob(renderjob.id, renderjob.artist)

      // If Royal Render specifies the Renderjob as disabled, set The fbRenderjobstatus to DISABLED, else continue with the typical Status evaluation process
      const drenderjob = await DRenderjob.createOneWith(
        renderjob.id,
        renderjob.title,
        renderjob.artist,
        {
          fbRenderjobStatus: disabled
            ? ERenderjobStatus.DISABLED
            : renderjob.fbStatus,
          rrRenderjobStatus: disabled ? undefined : rrStatus
        },
        remainingRenderTime
      )

      // Add the newly created Renderjob to a new Array
      rrRenderjobs.push(drenderjob)
    }
    return rrRenderjobs
  }

  /**
   * @description This Method is specified by the Repository interface, but not implemented yet
   * @throws A Method not implemented Error
   */
  public async exists(record: DRenderjob): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  /**
   * 
   * @param renderjobID The RenderjobID of the Renderjob which should be found in Royal Render
   * @param artistID The ArtistID of the requesting Artist
   */
  private async findRRRenderjob(renderjobID: string, artistID: string) {
    // The RenderjobID should be unique in Royal Render as a CompanyProjectName
    // Therefore we can set a Query filter for Royal Render with the specified RenderjobID as the CompanyProjectName
    // This will keep Network overhead
    this.rrModel.jobSetFilter('', renderjobID)

    // The Royal Render NodeJS module currently functions differently than other modules
    // example: rrModel.jobGetInfoSend() does not return any Renderjobinfo, but stores it into the rrModel.jobs variable
    if (!this.rrModel.jobGetInfoSend())
      throw new Error('Unable to retrieve RenderjobData from RR')

    const nbJobs = this.rrModel.jobs.getMaxJobsFiltered()
    // We can have a db Entry of a renderjob, but not a submitted job. We have to handle this case
    /* console.log('NBJOBS: ' + nbJobs) */
    if (nbJobs <= 0)
      return {
        remainingRenderTime: 0,
        rrStatus: undefined,
        disabled: undefined,
        renderjobID
      }

    // getJobMinInfor gives us information like the JobID with which we can query the getJobSend Info from Royal Render
    // The requested Renderjob gets queried here
    let rrrenderjobs: Job._JobSend[] = []
    let jIDs = []
    for (let i = 0; i < nbJobs; i++) {
      const jID = this.rrModel.jobs.getJobMinInfo_filterQueue(i).ID
      const job = this.rrModel.jobs.getJobSend(jID)
      if (job) {
        rrrenderjobs.push(job)
        jIDs.push(jID)
      }
    }

    // Since Royal Render creates for each Renderlayer an individual Renderjob, we have to evaluate if the Renderjob in context of rrRemote is finished, and not just one Renderlayer
    // One Renderjob in rrRemote is all Renderjobs with the same RenderjobID/CompanyProjectName in Royal Render
    // A Bug in the rrServer in Royal Render v. 8.2.24 sometimes does only return placeholder values, so the following procedure can fail
    let overallJobStatus: ERRrenderjobStatusValues
    let overallRemainingTime: number = 0
    let overallDisabled: boolean = false
    let companyProjectName: string = ''

    /* let nbJobsFinished = 0 */
    for (const job of rrrenderjobs) {
      /* console.log('JOBID: ' + job.IDstr())
      console.log('JOBLAYER: ' + job.layer)
      console.log('JOBSTATUS: ' + job.status) */

      // Initialize the variables companyProjectName and overallJobStatus
      if (!companyProjectName) companyProjectName = job.companyProjectName
      if (!overallJobStatus) overallJobStatus = job.status

/*       if (
        job.status === ERRrenderjobStatusValues.sFinished.valueOf() ||
        job.status === ERRrenderjobStatusValues.sScriptFinished.valueOf()
      )
        nbJobsFinished++ */

      // Evaluate the overallJobStatus, based on all submitted Renderlayers
      overallJobStatus =
        overallJobStatus < job.status ? overallJobStatus : job.status
      
        // evaluate the overallRemainingTime, which adds all remaining rendertime of each Renderlayer together 
        overallRemainingTime += Math.clamp(
        job.rendertime_remaining_seconds,
        0,
        Infinity
      )

      // If one Renderjob is disabled, the whole Renderjob is marked as Disabled
      overallDisabled = job.disabled ? job.disabled : overallDisabled
    }
/*     console.log('JOBSFINISHED: ' + nbJobsFinished)
    overallJobStatus =
      nbJobsFinished === nbJobs
        ? ERRrenderjobStatusValues.sFinished
        : overallJobStatus */

    return {
      remainingRenderTime: overallRemainingTime,
      rrStatus: overallJobStatus,
      renderjobID: companyProjectName,
      disabled: overallDisabled,
      jIDs
    }
  }

  /**
   * @description Gets a Renderjob or a Renderjob List from Firebase Firestore
   * @param input At least a RenderjobID or an ArtistID
   * @returns A Renderjob or a Renderjob List from Firebase Firestore
   */
  private async findDbRenderjob(
    input: RequireOnlyOne<RenderjobSearchInput, 'renderjobID' | 'artistID'>
  ): Promise<dbRenderjob | dbRenderjob[]> {
    // If a RenderjobID was provided...
    if (input.renderjobID) {
      // Get the Renderjob with the same RenderjobID
      const renderjobDoc = this.fbModel.doc(`renderjobs/${input.renderjobID}`)
      if (!renderjobDoc) throw new Error('Unable to get renderjobData')

      const renderjobSnap = await renderjobDoc.get()
      if (!renderjobSnap) throw new Error('Unable to get renderjobData')

      const renderjobData = renderjobSnap.data()
      if (!renderjobData) throw new Error('Unable to get renderjobData')

      return {
        id: renderjobDoc.id,
        title: renderjobData.title,
        artist: renderjobData.artist,
        fbStatus: renderjobData.status,
        createdAt: renderjobData.createdAt
      }
    }

    // Else...
    let renderjobArr: dbRenderjob[] = []

    // Get all the Renderjob entries which have the same ArtistID
    const renderjobSnap = await this.fbModel
      .collection('renderjobs')
      .where('artist', '==', `${input.artistID}`)
      .get()
    if (renderjobSnap.empty) return renderjobArr

    renderjobSnap.forEach(doc => {
      const data = doc.data()
      renderjobArr.push({
        id: doc.id,
        title: data.title,
        artist: data.artist,
        createdAt: data.createdAt,
        fbStatus: data.status
      })
    })

    return renderjobArr
  }

  /**
   * @description Takes a Renderjob domain Object and updates Firebase Firestore and Royal Render
   * @param renderjob The Renderjob which holds the new Values which should be updated
   * @returns The updated Renderjob Domain Object
   */
  public async update(renderjob: DRenderjob): Promise<DRenderjob> {
    // Update Royal Render and Firebase
    const rrUpdated = await this.updateRR(renderjob)
    const dbUpdated = await this.updateDB(renderjob)

    // Get the updated Renderjob Domain object from the Renderjob Repo
    const dRenderjob = await this.findBy({
      renderjobID: renderjob.id.toValue()
    })

    if (Array.isArray(dRenderjob))
      throw new Error('dRenderjob should not be an Array')

    return dRenderjob
  }

  /**
   * @description Updates Firebase Firestore with the new Values of the specified Renderjob Domain object
   * @param renderjob The Renderjob Domain object which holds the new values which should be updated in Firebase Firestore
   * @returns The updated Renderjob Domain object
   */
  private async updateDB(renderjob: DRenderjob): Promise<DRenderjob> {
    // Get the Renderjob from Firebase Firestore with the specified RenderjobID
    const doc = await this.fbModel.doc(`renderjobs/${renderjob.id.toValue()}`)

    // Update The Firebase Firestore Renderjob entry, no matter which value was updated
    await doc.update({
      title: renderjob.title,
      status: renderjob.status.renderjobStatus.valueOf()
    })

    // retrieve the newly updated Renderjob from Firebase Firestore
    const dRenderjob = await this.findBy({
      renderjobID: renderjob.id.toValue()
    })

    if (Array.isArray(dRenderjob))
      throw new Error('dRenderjob should not be an Array')

    return dRenderjob
  }

  /**
   * @description Only updates the Renderjob in Royal Render, if the Status should be changed to DISABLED
   * @param renderjob The Renderjob Domain object which holds the new values which should be updated in Royal Render
   * @returns The updated Renderjob Domain object
   */
  private async updateRR(
    renderjob: DRenderjob
  ): Promise<DRenderjob | undefined> {
    // If the incoming RenderjobStatus is not DISABLED, abort
    // We also can't find any Renderjob in RR if it's in submitting state
    // That means, that the Renderjob is not submitted to RR yet
    if (
      renderjob.status.renderjobStatus.valueOf() !==
      ERenderjobStatus.DISABLED.valueOf() ||
      renderjob.status.renderjobStatus.valueOf() <
      ERenderjobStatus.PREVIEWS.valueOf()
    )
      return undefined

    const { jIDs, disabled } = await this.findRRRenderjob(
      renderjob.id.toValue(),
      renderjob.artist.id.toValue()
    )

    // If the Royal Render RenderjobStatus is already DISABLED, abort
    if (disabled) return undefined

    // Else, update the Royal Render Renderjobstatus with DISABLED
    if (!this.rrModel.jobSendCommand(jIDs, this.rrJob._logMessage.lDisable, 0))
      console.error('Error jobSendCommand:' + this.rrModel.errorMessage())


    // Get the updated Renderjob
    const dRenderjob = await this.findBy({
      renderjobID: renderjob.id.toValue()
    })

    if (Array.isArray(dRenderjob))
      throw new Error('dRenderjob should not be an Array')

    return dRenderjob
  }
}
