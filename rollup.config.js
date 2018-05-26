import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
    input: './src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'ReactEditableContent',
        sourcemap: true,
        globals: {
            react: 'React',
            'prop-types': 'PropTypes'
        }
    },
    plugins: [
        nodeResolve({ jsnext: true, main: true }),
        uglify(),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    external: [
        'react',
        'prop-types'
    ]
}