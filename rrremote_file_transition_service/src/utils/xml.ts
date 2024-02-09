import { PathingService } from "../domain/pathing/pathingService"
import xml2js from 'xml2js'
import fs from 'fs-extra'
import path from 'path'
import { RRRemoteError } from "./rrremoteError"

/**
 * @description Tries to replace Templates of a Renderjob XML with relative Paths of the currently submitted Renderjob
 * @param artistID The ArtistID of the Artist who submitted a Renderjob
 * @param renderjobID The RenderjobID of the submitted Renderjob
 * @returns The Path to the modified XML
 */
export const resolveXML = async (artistID: string, renderjobID: string): Promise<boolean> => {
  const xmlParser = new xml2js.Parser()
  const xmlBuilder = new xml2js.Builder()

  const rootPath = PathingService.retrieveLocalPathWith(artistID,  renderjobID)
  const separator = '[WORKSPACE_PATH]'
  
  const xmlFindRegex = /([\w|\d|-]+\.xml$)/
  const flist = fs.readdirSync(rootPath)
  
  let xmlName = ''
  
  // find the xml of the Renderjob (first XML which is found will be used)
  for (const file of flist) {
    if (xmlFindRegex.test(file)){
      xmlName = xmlFindRegex.exec(file)[0]
      break
    }
    continue
  }

  if (!xmlName)
    throw new RRRemoteError('Unable to resolve XML File', artistID, renderjobID)
  
  const xmlPath = path.join(rootPath, xmlName)
  const xmlString = await fs.readFileSync(xmlPath)

  let xmlObj = await xmlParser.parseStringPromise(xmlString)

  // Submit XMLs will start with rrJob_submitFile
  // If this is not the case in the currently observed XML, throw an Error
  if (!xmlObj.rrJob_submitFile)
    throw new RRRemoteError('Unable to resolve XML File', artistID, renderjobID)

  // Temporarily save all modified and unmodified Jobs, so we can replace the old rrJob_submitFile.Job array with the modified Jobs array
  let allJobs = []
  // for each job in the submit File...
  for (let nbJob = 0; nbJob < xmlObj.rrJob_submitFile.Job.length; nbJob++) {
    const job = xmlObj.rrJob_submitFile.Job[nbJob];

    // for each job-object key/element, look if there is the separator pattern
    // if it is there, replace it with the Renderjob Path, which the Windows Server can access
    for (const key in job) {
      if (job.hasOwnProperty(key)) {
        const el = job[key][0]
        
        if (!el.includes(separator))
          continue
  
        job[key][0] = el.replace(separator, `//<ROYAL RENDER IP>/student/_IFS/${process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'}/${artistID}/${renderjobID}`)
      }
    }
    allJobs.push(job)
  }
  // update the xmlObj with the modified Jobs and write a new XML into the renderjob Folder
  xmlObj.rrJob_submitFile.Job = allJobs
  const modifiedXMLObj = xmlBuilder.buildObject(xmlObj)
  fs.writeFileSync(xmlPath, modifiedXMLObj)
  return true
}