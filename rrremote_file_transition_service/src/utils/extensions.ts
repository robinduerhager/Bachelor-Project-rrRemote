interface String {
  toPascalCase(): string
}

interface Math {
  clamp(input: number, min: number, max: number): number
}

// String operations like toLowerCase() can be used directly on Strings
// Therefore, calls like 'Hello, World'.toLowerCase() are possible.
// This expression injects the toPascalCase() Method to Strings, so that
// 'Hello, World'.toPascalCase() is possible
String.prototype.toPascalCase = function(this: string): string {
  return this.replace(/(\w)(\w*)/g, (g0, g1, g2) => {
    return g1.toUpperCase() + g2.toLowerCase()
  })
}

// Same procedure as String.prototype.toPascalCase
Math.clamp = function(input: number, min: number, max: number): number {
  return Math.min(Math.max(input, min), max)
}