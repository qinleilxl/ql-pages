#!/usr/bin/env node

process.argv.push('--cwd') // 指定新的当前工作目录
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
// process.argv.push(require.resolve('../lib/index.js'))
process.argv.push(require.resolve('..'))

console.log(process.argv);
require('gulp/bin/gulp');