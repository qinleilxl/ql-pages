const { src, dest, series, parallel, watch } = require('gulp'); // yarn add gulp --dev

const del = require('del'); // yarn add del --dev
const browserSync = require('browser-sync');

const loadPlugins = require('gulp-load-plugins'); //自动加载所有插件

const plugins = loadPlugins();
const bs = browserSync.create();

// const sass = require('gulp-sass'); // yarn add gulp-sass --dev
// const babel = require('gulp-babel'); // yarn add gulp-babel @babel/core @babel/preset-env --dev
// const swig = require('gulp-swig'); // yarn add gulp-swig --dev
// const imagemin = require('gulp-imagemin'); // yarn add gulp-imagemin --dev

const path = require('path');
const cwd = process.cwd(); // 当前工作目录

let config = {
  // default config
  build: {
    src:'src',
    dist:'dist',
    temp:'.temp',
    public:'public',
    paths:{
      styles:'assets/styles/*.scss',
      scripts:'assets/scripts/*.js',
      pages:'*.html',
      images:'assets/images/**',
      fonts:'assets/fonts/**',
    }
  }


}

try {
  const loadConfig = require(path.join(cwd,'pages.config.js'));
  config = Object.assign({}, config, loadConfig);
} catch (e) { }

//清理 .temp 临时目录
const cleanTemp = () => {
  return del([config.build.temp])
}

//清理 dist 临时目录
const cleanDist = () => {
  return del([config.build.dist])
}

// 编译样式文件
const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src})
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
}

// 编译脚本文件
// babel默认只是一个ECMAScript的转换平台，只是提供一个环境，具体去做转换的实际上是它内部的一些插件
// 而preset就是一些插件的集合
// @babel/preset-env 就是一些最新特性的整体打包
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src})
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
}

// 编译html模板
const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src})
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // cache 设置为false：swig默认会启动缓存，导致代码修改后浏览器不能及时更新，所以这里关闭缓存
    .pipe(dest(config.build.temp))
}

// 图片压缩处理
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 字体文件复制
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src})
    .pipe(plugins.imagemin()) // imagemin遇到不是图片格式的不会进行压缩
    .pipe(dest(config.build.dist))
}

// 其他文件复制
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

// 开发服务启动
const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/image/**',image)
  // watch('src/assets/fonts/**',font)
  // watch('public/**',extra)

  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ],{ cwd: config.build.src }, bs.reload)

  watch([
    "**",
  ],{ cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false,
    port: 3380, // 指定端口
    // open: true, // 是否自动打开浏览器
    // files: '.temp/**',
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public], // 指定根目录
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

// 处理html中引用文件的指向问题
const useref = () => {
  return src(config.build.temp+'/'+config.build.paths.pages, { base: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify())) // js 代码压缩
    .pipe(plugins.if(/\.css$/, plugins.cleanCss())) // css 代码压缩
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ // html 代码压缩
      collapseWhitespace: true, // 删除空白字符
      minifyCSS: true, // style块压缩
      minifyJS: true // script块压缩
    })))
    .pipe(dest(config.build.dist))
}

// 清除所有
const clean = parallel(cleanTemp, cleanDist);

// 编译任务：先清除 .temp 目录，然后并行执行 style, script, page 分别对样式文件、脚本文件、模板文件进行编译
const compile = series(cleanTemp, parallel(style, script, page))

// 构建任务：先清除 .temp和dist 目录
// 然后执行编译任务后将样式文件、脚本文件、模板文件进行压缩
// 再然后将图片压缩复制、字体文件复制、其它文件复制到 dist 目录
// 最后清除 .temp 临时目录
const build = series(cleanDist, parallel(series(compile, useref), image, font, extra), cleanTemp)

// 开发热启动服务器
// 先编译相关文件，然后启动服务器，并用watch持续监听文件更改，监听到文件变化，watch会执行响应的编译任务，
// browserSync监听的目录更新后会刷新浏览器页面
const develop = series(compile, serve)

module.exports = {
  build,
  develop,
  clean
}