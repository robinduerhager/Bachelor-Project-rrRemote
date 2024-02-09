module.exports = {
  webpack: (config, options, webpack) => {
    config.entry.main = ['./src/main.ts']

    config.resolve = {
      extensions: ['.ts', '.js', '.json']
    }

    config.module.rules.push(
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      },
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader'
      }
    )

    return config
  }
}
