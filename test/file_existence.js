/* jshint mocha: true */

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var pkg = require('./../package.json');
var dirs = pkg['h5bp-configs'].directories;

var expectedFilesInArchiveDir = [
    pkg.name + '_v' + pkg.version + '.zip'
];

var expectedFilesInDistDir = [

    '.editorconfig',
    '.gitattributes',
    '.gitignore',
    '.htaccess',

    '404.html',

    'apple-touch-icon.png',
    'browserconfig.xml',
    'crossdomain.xml',

    'css/', // for directories, a `/` character
            // should be included at the end
        'css/main.css',
        'css/normalize.css',

    'doc/',
        'doc/TOC.md',
        'doc/css.md',
        'doc/extend.md',
        'doc/faq.md',
        'doc/html.md',
        'doc/js.md',
        'doc/misc.md',
        'doc/usage.md',

    'favicon.ico',
    'humans.txt',

    'img/',
        'img/.gitignore',
        'img/bg_640.jpg',
        'img/bg_960.jpg',
        'img/bg_1280.jpg',
        'img/bg_1600.jpg',
        'img/bg_1920.jpg',
        'img/fun.png',
        'img/logo_350VancouverLogo.jpeg',
        'img/logo_bicycle_valet.jpg',
        'img/logo_Dogwood_Logo_Grey.png',
        'img/logo_DSF.jpg',
        'img/logo_fish.jpg',
        'img/logo_forest-ethic.png',
        'img/logo_gen-why.jpg',
        'img/logo_georgia.png',
        'img/logo_greenpeace.jpg',
        'img/logo_head.png',
        'img/logo_JointheCircleLogo-03.jpg',
        'img/logo_LOS.png',
        'img/logo_tanker_free.png',
        'img/logo_TheStarfish.jpg',
        'img/logo_together.jpg',

    'fonts/',
        'fonts/farray-webfont.eot',
        'fonts/farray-webfont.svg',
        'fonts/farray-webfont.ttf',
        'fonts/farray-webfont.woff',
        'fonts/farray-webfont.woff2',
        'fonts/fontello.eot',
        'fonts/fontello.svg',
        'fonts/fontello.ttf',
        'fonts/fontello.woff',

    'index.html',
    'index.final.html',

    'js/',
        'js/app.js',
        'js/app.min.js',
        'js/vendor/',
            'js/vendor/jquery-' + pkg.devDependencies.jquery + '.min.js',
            'js/vendor/jquery.min.map',
            'js/vendor/ls.respimg.min.js',
            'js/vendor/modernizr-2.8.3.min.js',

    'LICENSE.txt',
    'robots.txt',
    'tile-wide.png',
    'tile.png'

];

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function checkFiles(directory, expectedFiles) {

    // Get the list of files from the specified directory
    var files = require('glob').sync('**/*', {
        'cwd': directory,
        'dot': true,      // include hidden files
        'mark': true      // add a `/` character to directory matches
    });

    // Check if all expected files are present in the
    // specified directory, and are of the expected type
    expectedFiles.forEach(function (file) {

        var ok = false;
        var expectedFileType = (file.slice(-1) !== '/' ? 'regular file' : 'directory');

        // If file exists
        if (files.indexOf(file) !== -1) {

            // Check if the file is of the correct type
            if (file.slice(-1) !== '/') {
                // Check if the file is really a regular file
                ok = fs.statSync(path.resolve(directory, file)).isFile();
            } else {
                // Check if the file is a directory
                // (Since glob adds the `/` character to directory matches,
                // we can simply check if the `/` character is present)
                ok = (files[files.indexOf(file)].slice(-1) === '/');
            }

        }

        it('"' + file + '" should be present and it should be a ' + expectedFileType, function () {
            assert.equal(true, ok);
        });

    });

    // List all files that should be NOT
    // be present in the specified directory
    (files.filter(function (file) {
        return expectedFiles.indexOf(file) === -1;
    })).forEach(function (file) {
        it('"' + file + '" should NOT be present', function () {
            assert(false);
        });
    });

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function runTests() {

    describe('Test if all the expected files, and only them, are present in the build directories', function () {

        describe(dirs.archive, function () {
            checkFiles(dirs.archive, expectedFilesInArchiveDir);
        });

        describe(dirs.dist, function () {
            checkFiles(dirs.dist, expectedFilesInDistDir);
        });

    });

}

runTests();
