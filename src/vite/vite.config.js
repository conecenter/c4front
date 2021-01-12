/*
import reactPlugin from 'vite-plugin-react'
export default {
  jsx: 'react',
  plugins: [reactPlugin]
}
    proxy: {
        '/sse': 'https://'+host+'/sse',
        '/connect': 'https://'+host+'/connect',
    },
*/

//const host = process.env.C4HOST
//console.log("host ("+host+")")
export default {
    /*jsx: 'react',*/
    alias: {
        'react': "/node_modules/@pika/react/source.development.js",
        'react-dom': "/node_modules/@pika/react-dom/source.development.js",
    },
    hmr: false,
}