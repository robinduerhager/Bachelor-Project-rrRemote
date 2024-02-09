export class RRCommandService {

  // For more Information see: https://www.royalrender.de/help8/index.html?rrSubmitterConsole.html

  /**
   * @description Generates a Royal Render command, based on the given xmlName, renderjobID and artistID
   * @param xmlName The XML name which describes the Renderjob and all his Rendering options which should be submitted
   * @param artistID The ID of the requesting Artist
   * @param renderjobID The RenderjobID of the Renderjob which should be submitted
   * @returns A String that represents the Royal Render Submit command for the rrSubmitterconsole
   */
  public static generateCommand(
    xmlName: string,
    artistID: string,
    renderjobID: string
  ): string {
    // RRCommands are typically concatenated like this template: <Path To rrSubmitterconsole> <Path to XML> <optional RRCommand Submit Flags> <Optional RRCommand Submit Options>
    return `${RRCommandService.getScenePath(xmlName, renderjobID, artistID)} ${RRCommandService.getSubmitFlags(artistID)} ${RRCommandService.getSubmitOptions(artistID, renderjobID)}`
  }

  /**
   * @description Concatenates the Path part for the RRCommand to the XML
   * @param xmlName The XML name which describes the Renderjob and all his Rendering options which should be submitted
   * @param renderjobID The RenderjobID of the Renderjob which should be submitted
   * @param artistID The ID of the requesting Artist
   * @returns A String that represents the path to the XML which describes the Renderjob which should be submitted, relative to the basepath, probably ending in .../student/_IFS/PROD/
   */
  private static getScenePath(xmlName: string, renderjobID: string, artistID: string): string  {
    return `${artistID}\\${renderjobID}\\${xmlName}`
  }

  /**
   * @description Concatenates the optional submitflags for the RRCommand. -ADE stands for All Delete Frames, so before resubmitting, Frames will be deleted first. However, since we only can submit a Renderjob once, this shouldn't have any effect. It's concatenated for safety. -NSEC means No Scene Exist Check. This was necessarry when trying to submit the Renderjob through a linux distribution, however, since linux alpine is not compiled with glibc but with musl libc, we can't use the rrSubmitterconsole in the docker Container. The Flag Still there for safety. The CustomArtistID Flag is a Custom Flag, which will be important for when a Renderjob finishes and the Python Script sends a RabbitMQ command to the File-Service for zipping the Renderings
   * @param artistID The ArtistID of the currently requesting Artist
   * @returns A String which represents the specified SubmitFlags for the RRcommand
   */
  private static getSubmitFlags(artistID?: string): string {
    if (artistID)
      return `-ADE -NSEC -CustomArtistID ${artistID}`

    return `-ADE -NSEC`
  }

  /**
   * @description Concatenates Submit Options for the RRCommand like available Client Groups, The Submitting Artist, so the UserName is set to the ArtistID, The CompanyProjectName, so the RenderjobID is the CompanyProjectName. These Parameters will make it easier to query Renderjobs
   * @param artistID The ArtistID of the currently requesting Artist
   * @param renderjobID The RenderjobID of the Renderjob which should be submitted
   * @returns A String that represents concatenates Submit Options for the RRCommand which should be generated
   */
  private static getSubmitOptions(artistID: string, renderjobID: string) {
    return `${RRCommandService.getClientGroups()} ${RRCommandService.getSubmitingArtist(artistID)} ${RRCommandService.getProjectName(renderjobID)} ${RRCommandService.getMiscOptions()}`
  }

  /**
   * @description Concatenates a String of available ClientGroups. The Hochschule Hamm-Lippstadt uses 3 main Client Groups for Rendering.
   * @returns A String that represents all Client Groups which should be used for the submittable Renderjob
   */
  private static getClientGroups(): string {
    // The Client Group Sandtrooper is the smallest Room of Clients which can be used.
    // If more client Group names are set here, the subimtted Renderjob will use more Client Groups
    const validClientGroups = ['Sandtrooper']

    const chainedClientGroups = validClientGroups.join(';')
    return `"DCG=1~${chainedClientGroups}"`
  }

  /**
   * @description Adds the UserName = ArtistID Flag to the SubmitterOptions
   * @param artistID The ArtistID of the currently requesting Artist
   * @returns A String that represents a substring of the SubmitterOptions, which adds the UserName = ArtistID
   */
  private static getSubmitingArtist(artistID: string): string {
    return `"UN=1~${artistID}"`
  }

  /**
   * @description Adds the Projectname to the SubmitterOptions as CompanyProjectName = RenderjobID
   * @param renderjobID The RenderjobID of the Renderjob which should be submitted
   * @returns A String that represents a substring of the SubmitterOptions, which adds the CompanyProjectName = RenderjobID
   */
  private static getProjectName(renderjobID: string): string {
    return `"CPN=1~${renderjobID}"`
  }

  /**
   * @description This function adds some additional Flags to the SubmitterOptions
   * @returns A String that represents a substring of the SubmitterOptions
   */
  private static getMiscOptions(): string {
    // activate the Finish-Script 'UpdaterrRemoteFin' in Royal Render for this Renderjob
    // This is necessarry, because Royal Render has to trigger rrRemote after finishing the submittable Renderjob
    return `"PPUpdaterrRemoteFin=1~1"`
  }
}
