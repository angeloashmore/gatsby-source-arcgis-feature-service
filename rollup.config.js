import babel from 'rollup-plugin-babel'
import clear from 'rollup-plugin-clear'
import pkg from './package.json'

const makeExternalPredicate = externalArr => {
  if (externalArr.length === 0) return () => false
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return id => pattern.test(id)
}

export default {
  input: 'src/gatsby-node.js',
  output: { file: 'dist/gatsby-node.js', format: 'cjs', sourcemap: true },
  external: makeExternalPredicate([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'url',
  ]),
  plugins: [clear({ targets: ['dist'] }), babel()],
}
