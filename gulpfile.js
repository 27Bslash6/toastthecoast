var fs = require('fs');
var path = require('path');

var gulp = require('gulp');

var batch = require('gulp-batch');

var watch = require('gulp-watch');

var sass = require('gulp-sass');

var gpUglify = require('gulp-uglify');

var gpConcat = require('gulp-concat');

var gpRename = require('gulp-rename');

var replace = require('gulp-replace');

var yaml = require('js-yaml');
var fs   = require('fs');


// Load all gulp plugins automatically
// and attach them to the `plugins` object
var plugins = require('gulp-load-plugins')();

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg['h5bp-configs'].directories;



// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '_v' + pkg.version + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath)
        });

    });

    archiver.pipe(output);
    archiver.finalize();

});

gulp.task('clean', function (done) {
    require('del')([
        dirs.archive,
        dirs.dist
    ], done);
});

gulp.task('copy', [
    'copy:.htaccess',
    'copy:index.html',
    'copy:jquery',
    'copy:license',
    'copy:main.css',
    'copy:misc',
    'copy:normalize'
]);

gulp.task('copy:.htaccess', function () {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess')
        .pipe(plugins.replace(/# ErrorDocument/g, 'ErrorDocument'))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
        .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
        .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
        .pipe(gulp.dest(dirs.dist + '/js/vendor'));
});

gulp.task('copy:license', function () {
    return gulp.src('LICENSE.txt')
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:main.css', function () {

    var banner = '/*! HTML5 Boilerplate v' + pkg.version +
        ' | ' + pkg.license.type + ' License' +
        ' | ' + pkg.homepage + ' */\n\n';

    return gulp.src(dirs.src + '/css/main.css')
        .pipe(plugins.header(banner))
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions', 'ie >= 8', '> 1%'],
            cascade: false
        }))
        .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        dirs.src + '/**/*',

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        '!' + dirs.src + '/scss{,/**}',
        '!' + dirs.src + '/css/main.css',
        '!' + dirs.src + '/js/modules{,/**}',
        '!' + dirs.src + '/js/plugins{,/**}',
        '!' + dirs.src + '/fonts/*.html',
        '!' + dirs.src + '/fonts/*.css',
        '!' + dirs.src + '/fonts/*.txt',
        '!' + dirs.src + '/fonts/specimen_files{,/**}',
        '!' + dirs.src + '/index.html'

    ], {

        // Include hidden files by default
        dot: true

    }).pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:normalize', function () {
    return gulp.src('node_modules/normalize.css/normalize.css')
        .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + '/js/*.js',
        '!' + dirs.src + '/js/app*.js',
        dirs.test + '/*.js'
    ]).pipe(plugins.jscs())
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('sass', function () {
    return gulp.src(dirs.src + '/scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(dirs.src + '/css'));
});

gulp.task('compress', function () {
    return gulp.src([dirs.src + '/js/vendor/ls.bgset.js', dirs.src + '/js/vendor/lazysizes.js', dirs.src + '/js/plugins/*.js', dirs.src + '/js/modules/*.js'])
        .pipe(gpConcat('app.js'))
        .pipe(gulp.dest(dirs.src + '/js'))
        .pipe(gpRename('app.min.js'))
        .pipe(gpUglify())
        .pipe(gulp.dest(dirs.src + '/js'));
});

gulp.task('finalise', function () {
    var conf;

    // Get document, or throw exception on error
    try {
        conf = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
    } catch (e) {
        console.log(e);
    }

    if (conf.assets.protocol.indexOf(':') === -1 && conf.assets.protocol !== '//') {
        conf.assets.protocol = conf.assets.protocol + '://';
    }

    gulp.src(dirs.dist + '/index.html')
        .pipe(replace(/(\.\/)(css|js|img)(\/[^\s]+)?/g, conf.assets.protocol + conf.assets.domain + '/' + conf.assets.path + '/$2$3'))
        .pipe(gpRename('index.final.html'))
        .pipe(gulp.dest(dirs.dist));

});

// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
        done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean', 'lint:js', 'compress', 'sass'],
        'copy',
        'finalise',
        done);
});

gulp.task('watch', function () {

    watch([
        dirs.src + '/scss/**/*',
        dirs.src + '/**/*.html',
        dirs.src + '/js/**/*',
        '!' + dirs.src + '/js/*.js'
    ], batch(function (events, done) {
        gulp.start('build', done);
    }));

});

gulp.task('default', ['build']);
