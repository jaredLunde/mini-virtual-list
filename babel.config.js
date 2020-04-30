module.exports = (api) => {
  const module = api.env('module')
  const presetEnv = [
    '@lunde/es',
    {
      env: {
        modules: module ? false : 'commonjs',
        targets: module
          ? {
              browsers: '> 2%',
            }
          : {
              node: '8',
            },
      },
      devExpression: false,
      objectAssign: false,
    },
  ]

  return {
    presets: [
      ['@babel/preset-react', {/*runtime: 'automatic',*/ useSpread: true}],
      presetEnv,
    ],
    plugins: ['optimize-react', 'annotate-pure-calls'],
  }
}
