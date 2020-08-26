const { src, dest, parallel, watch, series } = require('gulp');
const dotEnv = require('dotenv').config();
const ts = require('gulp-typescript');
const connect = require('gulp-connect');
const clean = require('gulp-clean');
const gEdge = require('gulp-edgejs');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const sass = require("gulp-sass");
const babel = require("gulp-babel");
const gutil = require('gulp-util');
const sassGlob = require('gulp-sass-glob');

const tslint = require('gulp-tslint');
const sassLint = require('gulp-sass-lint');
const htmllint = require('gulp-htmllint');
const fancyLog = require('fancy-log');
const colors = require('ansi-colors');


/**
 *
 * @param value
 * @return {boolean}
 */
function isTrueEnvBoolean(value) {
    return /^(true|1)$/igm.test(value);
}


/**
 *
 * @return {*}
 * @constructor
 */
const EDGE = () => {
    return src(`${process.env.PATH_SRC_NAME}/views/*.edge`)
        .pipe(gEdge(`${process.env.PATH_SRC_NAME}/controllers/`, {
            refresh: true
        }))

        .pipe(dest(`${process.env.PATH_DIST_NAME}`))
        .pipe(connect.reload());
};


/**
 *
 * @return {*}
 * @constructor
 */
const HTML = () => {
    return src(`${process.env.PATH_SRC_NAME}/**/*.html`)

        .pipe(dest(`${process.env.PATH_DIST_NAME}`))
        .pipe(connect.reload());
};


/**
 *
 * @return {*}
 * @constructor
 */
const STYLES = () =>{
    return src(`${process.env.PATH_SRC_NAME}/styles/*.scss`)
        .pipe(sourcemaps.init())
        .pipe(sassGlob().on('error', gutil.log))
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }).on('error', gutil.log))

        .pipe(sourcemaps.write('.'))
        .pipe(dest(`${process.env.PATH_DIST_NAME}/styles`))
        .pipe(connect.reload());
};


/**
 *
 * @return {*}
 * @constructor
 */
const SCRIPTS = () =>{
    return src(`${process.env.PATH_SRC_NAME}/scripts/*.ts`)
        .pipe(sourcemaps.init())
        .pipe(ts({
            declaration: false,
            target: 'es6',
            removeComments: true
        })).on('error', gutil.log)
        .pipe(babel().on('error', gutil.log))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(`${process.env.PATH_DIST_NAME}/scripts`))
        .pipe(connect.reload());
};


/**
 *
 * @return {*}
 * @constructor
 */
const ASSETS = () =>{
    return src(`${process.env.PATH_SRC_NAME}/assets/**/*.*`)

        .pipe(dest(`${process.env.PATH_DIST_NAME}/assets`))
        .pipe(connect.reload());
};




/**
 *
 * @constructor
 */
const WATCH = () =>{
    watch([`./${process.env.PATH_SRC_NAME}/**/*.html`], series(parallel(HTML), parallel(HTMLLint)));
    watch([`./${process.env.PATH_SRC_NAME}/views/**/*.edge`, `${process.env.PATH_SRC_NAME}/controllers/**/*.js`], series(parallel(EDGE), parallel(HTMLLint)));
    watch([`./${process.env.PATH_SRC_NAME}/styles/**/*.scss`], series(parallel(STYLES), parallel(SCSSLint)));
    watch([`./${process.env.PATH_SRC_NAME}/scripts/**/*.ts`], series(parallel(SCRIPTS), parallel(TSLint)));
    watch([`./${process.env.PATH_SRC_NAME}/assets/**/*.*`], parallel(ASSETS));
};


/**
 *
 * @constructor
 */
const CONNECT = () => {
    connect.server({
        root: process.env.PATH_DIST_NAME,
        host: process.env.SERVER_HOST,
        port: process.env.SERVER_PORT,
        https: isTrueEnvBoolean(process.env.SERVER_SSL),
        livereload: isTrueEnvBoolean(process.env.SERVER_LIVERELOAD),
        middleware: function(connect, opt) {
            return [
                function(req, res, next){
                    req.method = 'GET';
                    return next();
                }
            ];
        },


    });
};

/**
 * LINTS
 */

/**
 *
 * @return {NodeJS.ReadWriteStream}
 * @constructor
 */
const TSLint = () => {
    return src(`${process.env.PATH_SRC_NAME}/scripts/**/*.ts`)
        .pipe(tslint({
            formatter: 'stylish',
            configuration: './tslint.json'
        }))
        .pipe(tslint.report({
            emitError: false
        }));
};

const SCSSLint = () => {
    return src(`${process.env.PATH_SRC_NAME}/styles/**/*.scss`)
        .pipe(sassLint({
            options: {
                formatter: 'stylish',
            },
            configFile: '.sass-lint.yml'
        }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
};

const HTMLLint = () => {
    return src(`${process.env.PATH_DIST_NAME}/**/*.html`)
        .pipe(htmllint({}, (filepath, issues) => {
            if (issues.length > 0) {
                issues.forEach(function (issue) {
                    fancyLog(colors.cyan('[gulp-htmllint] ') + colors.white(filepath + ' [' + issue.line + ',' + issue.column + ']: ') + colors.red('(' + issue.code + ') ' + issue.msg));
                });

                process.exitCode = 1;
            }
        }));
};


/**
 *
 * @return {*}
 * @constructor
 */
const clearDest = () => {
    return src(`${process.env.PATH_DIST_NAME}`)
        .pipe(clean()).on('error', gutil.log);
};

exports.EDGE = EDGE;
exports.HTML = HTML;
exports.STYLES = STYLES;
exports.SCRIPTS = SCRIPTS;
exports.ASSETS = ASSETS;
exports.WATCH = WATCH;
exports.CONNECT = CONNECT;
exports.clearDest = clearDest;
exports.TSLint = TSLint;
exports.SCSSLint = SCSSLint;
exports.HTMLLint = HTMLLint;

exports.default = series(parallel(EDGE, STYLES, SCRIPTS, ASSETS, HTML), parallel(TSLint, SCSSLint, HTMLLint), parallel(CONNECT, WATCH));
exports.clean = parallel(clearDest);
