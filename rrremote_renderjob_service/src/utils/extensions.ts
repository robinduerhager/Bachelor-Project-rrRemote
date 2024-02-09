interface String {
  toPascalCase(): string
}

interface Math {
  clamp(input: number, min: number, max: number): number
}


String.prototype.toPascalCase = function(this: string): string {
  return this.replace(/(\w)(\w*)/g, (g0, g1, g2) => {
    return g1.toUpperCase() + g2.toLowerCase()
  })
}

Math.clamp = function(input: number, min: number, max: number): number {
  return Math.min(Math.max(input, min), max)
}