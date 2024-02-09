export abstract class Rule {
  protected rules: RegExp[]

  public abstract validate(pathsToTest: string[]): string
  protected abstract init(rules: RegExp[]): RegExp[]
}