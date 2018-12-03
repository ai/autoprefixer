let gulp = require('gulp')
let path = require('path')
let fs = require('fs-extra')
let postcss = require('gulp-postcss')
let rename = require('gulp-rename')

gulp.task('clean', done => {
  fs.remove(path.join(__dirname, 'autoprefixer.js'), () => {
    fs.remove(path.join(__dirname, 'build'), done)
  })
})

gulp.task('build:lib', ['clean'], () => {
  let babel = require('gulp-babel')

  return gulp.src(['{lib,data}/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('build/'))
})

gulp.task('build:docs', ['clean'], () => {
  let ignore = require('fs').readFileSync('.npmignore').toString()
    .trim().split(/\n+/)
    .concat(['.npmignore', 'index.js', 'package.json', 'logo.svg', 'AUTHORS'])
    .map(i => '!' + i)

  return gulp.src(['*'].concat(ignore))
    .pipe(gulp.dest('build'))
})

gulp.task('build:bin', ['clean'], () => {
  return gulp.src('bin/*').pipe(gulp.dest('build/bin'))
})

gulp.task('build:package', ['clean'], () => {
  let editor = require('gulp-json-editor')

  return gulp.src('./package.json')
    .pipe(editor(json => {
      json.main = 'lib/autoprefixer'
      delete json.devDependencies
      delete json.babel
      delete json.scripts
      delete json.jest
      delete json.browserslist
      delete json.eslintConfig
      delete json['size-limit']
      delete json['husky']
      delete json['lint-staged']
      delete json.dependencies['@babel/register']
      return json
    }))
    .pipe(gulp.dest('build'))
})

gulp.task('build', ['build:lib', 'build:docs', 'build:bin', 'build:package'])

gulp.task('standalone', ['build:lib'], done => {
  let builder = require('browserify')({
    basedir: path.join(__dirname, 'build'),
    standalone: 'autoprefixer'
  })
  builder.add('./lib/autoprefixer.js')

  builder
    .transform('babelify', {
      global: true,
      presets: [
        [
          '@babel/env', {
            targets: {
              node: 6
            },
            loose: true
          }
        ]
      ]
    })
    .bundle((error, build) => {
      if (error) throw error

      fs.removeSync(path.join(__dirname, 'build'))

      let rails = path.join(__dirname, '..', 'autoprefixer-rails',
        'vendor', 'autoprefixer.js')
      if (fs.existsSync(rails)) {
        fs.writeFileSync(rails, build)
      } else {
        let out = path.join(__dirname, 'autoprefixer.js')
        fs.writeFileSync(out, build)
      }
      done()
    })
})

gulp.task('compile-playground', () => {
  let autoprefixer = require('./build')
  return gulp.src('./playground/input.css')
    .pipe(rename('output.css'))
    .pipe(postcss([autoprefixer({ grid: 'autoplace' })]))
    .pipe(gulp.dest('./playground'))
})

gulp.task('initialise-playground', ['build'], () => {
  return gulp.start('compile-playground')
})

gulp.task('watch-playground', () => {
  return gulp.watch('./playground/input.css', ['compile-playground'])
})

// Run "gulp play" to experiment with the current implementation of the code
gulp.task('play', ['initialise-playground'], () => {
  gulp.start('watch-playground')
})

gulp.task('default', ['build'])
