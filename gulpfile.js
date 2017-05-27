var gulp = require("gulp");
var i18n = require("gulp-html-i18n");
var ts = require("gulp-typescript");
var sass=require("gulp-sass");
var tsProject = ts.createProject("tsconfig.json");
var browserify=require("browserify");
var source = require('vinyl-source-stream');

gulp.task("sass",['source'],function(){
    return gulp.src('./src/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist'));
})

gulp.task("source",['typescript'],function(){
    return gulp.src('./src/**/*.{html,js,handlebars,jpg,png,svg}')
    .pipe(gulp.dest('./dist'));
})

gulp.task("typescript", function () {
        return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("./dist"));
});

gulp.task("browserify",['sass'],function (){
	return browserify({
		basedir:'./dist/app/scripts',
		entries:['main.js']
	})
    .on('error', function(e){
            console.log(e);
         })
    .bundle()
 	.pipe(source('bundle.js'))
    .pipe(gulp.dest('./dist/app/scripts'));
})

gulp.task('localize-build',['browserify-share'],function() {
  var dest  = './dist/i18n';
  var index = './src/**/*.html';

  return gulp.src(index)
    .pipe(i18n({
      createLangDirs:true,
      langDir: './lang',
      trace: false
    }))
    .pipe(gulp.dest(dest));
});

gulp.task('localize-copy',['localize-build'],function(){

    var locales=['en','es','jp'];
    for (var i=0;i<locales.length;i++)
    {
    gulp.src(['dist/app/**/*','!dist/app/views/**/*'])
    .pipe(gulp.dest('dist/i18n/'+locales[i]+'/app'));
    }
})

gulp.task("browserify-share",['browserify'],function (){
  return browserify({
    basedir:'./dist/app/scripts',
    entries:['share.js']
  })
    .on('error', function(e){
            console.log(e);
         })
    .bundle()
  .pipe(source('share.bundle.js'))
    .pipe(gulp.dest('./dist/app/scripts'));
})

gulp.task('default',['typescript','source','sass','browserify','browserify-share','localize-build','localize-copy']);