import { Rule } from "./rule"
import { renderjobRepo } from "../../infrastructure"

export class MayaRule extends Rule {
  public constructor() {
    super()
    this.rules = this.init()
  }

  /**
   * @description validates The incoming Filepaths Array with the specified Ruleset
   * @param pathsToTest An Array of relative Filepaths for the Renderjob in question
   * @returns A String that represents the XML Path, relative to the Renderjob Root Folder
   */
  public validate(pathsToTest: string[]): string{
    const nbRules = this.rules.length
    let validations = []

    // For each path in the Array, look which validate and save the testresults in a separate Array
    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i]
      validations.push(pathsToTest.some(path => rule.test(path)))
    }

    // If we didn't execute every validation check, we should abort
    // Because this would be undesired behaviour
    if (validations.length !== nbRules)
      throw new Error('Not every validation check was executed')

    // If not every validation is true, some validation checks have failed
    // This can lead to undesired behaviour, so we better abort the operation here
    if (!validations.every(validation => validation === true))
      throw new Error('Some validation checks failed')

    // The xml validation is the last one in the rules Array
    // We filter the paths Array to only get the XML path to return it
    return pathsToTest.filter(path => {
      if (this.rules[this.rules.length-1].test(path))
        return this.rules[this.rules.length-1].exec(path)

      // If the current path was not the one we are looking for, continue
      return
    })[0]
  }

  /**
   * @description Initializes The oncalled Rulesystem with the specified Ruleset
   */
  protected init(): RegExp[] {
    return [
      /^workspace\.mel/,
    //  /^sourceimages\//,
      /^images\//,
    //  /^scenes\//,
      /\w+\.(ma|mb)/,
      /(?:^\w+\.xml$)/
    ]
  }
}