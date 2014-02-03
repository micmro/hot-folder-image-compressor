"use strict";

//Dependencies
var path = require("path")
	,fs = require("fs")
	,os = require('os')
	,async = require('async')
	,watch = require('node-watch')	
	,imagemin = require('image-min')
	,colors = require('colors');

//Options and settings that are / migth later be arguments
var options = {
	watchPath : path.resolve(__dirname, process.argv[2]||"../images/Source")
	,resultPath : path.resolve(__dirname, process.argv[3]||"../images/Result")
	,imageminOptions : {
		cache: true,
		optimizationLevel: 7,
		progressive: true
	}
};

//start with tacky logo
console.log("\n\n    )              (                              (                                                                                       ".red);
console.log(" ( /(          )   )\\ )      (   (                )\\ )                               (                                                    ".red);
console.log(" )\\())      ( /(  (()/(      )\\  )\\ )   (   (    (()/(    )       )  (  (     (      )\\           )           (      (               (    ".red);
console.log("((_)\\   (   )\\())  /(_)) (  ((_)(()/(  ))\\  )(    /(_))  (     ( /(  )\\))(   ))\\   (((_)   (     (     `  )   )(    ))\\ (   (    (   )(   ".red);
console.log(" _((_)  )\\ (_))/  (_))_| )\\  _   ((_))/((_)(()\\  (_))    )\\  ' )(_))((_))\\  /((_)  )\\___   )\\    )\\  ' /(/(  (()\\  /((_))\\  )\\   )\\ (()\\  ".red);
console.log("| || | ((_)| |_   | |_  ((_)| |  _| |(_))   ((_) |_ _| _((_)) ((_)_  (()(_)(_))   ((/ __| ((_) _((_)) ((_)_\\  ((_)(_)) ((_)((_) ((_) ((_) ".red);
console.log("| __ |/ _ \\|  _|  | __|/ _ \\| |/ _` |/ -_) | '_|  | | | '  \\()/ _` |/ _` | / -_)   | (__ / _ \\| '  \\()| '_ \\)| '_|/ -_)(_-<(_-</ _ \\| '_| ".red);
console.log("|_||_|\\___/ \\__|  |_|  \\___/|_|\\__,_|\\___| |_|   |___||_|_|_| \\__,_|\\__, | \\___|    \\___|\\___/|_|_|_| | .__/ |_|  \\___|/__//__/\\___/|_|   ".red);
console.log("                                                                    |___/                             |_|                                  \n\n\n".red);
console.log("compressing images in ", options.watchPath.bold);


//compress changed image
var compressImage = function(filename){
	var saveTarget = path.join(options.resultPath, path.relative(options.watchPath, filename));
	fs.mkdir(path.dirname(saveTarget), function(){
		imagemin(filename, saveTarget, options.imageminOptions, function (err, data){
			formatFileCompressionLog(err, data, filename);
		});
	});
};


var initChangeWatch = function (err, data){
	if (err) {
		console.log(err.red);
	}
	console.log("===========================".green);	
	console.log("watching", options.watchPath.bold, "for changes");
	console.log("press ctrl+c to stop and exit ...");
	
	watch(options.watchPath, { recursive: true, followSymLinks: true }, filterImages(compressImage));
};


var filterImages = function(fn) {
	return function(filename) {
		if (/^.(jpg|jpeg|gif|png)$/.test(path.extname(filename).toLowerCase())) {
			fn(filename);
		}
	};
};


//file system walker
var walk = function(dir, onFolderFound, done){
	var images = [];
	fs.readdir(dir, function(err, list){
		if(err){
			return done(err);
		}
		var pending = list.length;

		if(!pending){
			return done(null, images);
		}

		onFolderFound(dir);

		list.forEach(function(file) {
			file = path.join(dir, file);
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, onFolderFound, function(err, res) {
						images = images.concat(res);
						if(!--pending){
							done(null, images);
						}
					});
				} else {
					filterImages(function(){
						images.push(file);
					})(file);
					
					if(!--pending){
						done(null, images);
					}
				}
			});
		});
	});
};

var formatFileCompressionLog = function(err, data, file){
	var tabSpacer = "\t";
	if (err) {
		console.log(err.red);
	}else if (data.diffSizeRaw > 10) {
		if(data.diffSize.toString().length < 9) {
			tabSpacer += "\t";
		}
		console.log("saved " + data.diffSize.toString().bold, tabSpacer + "for \"" + path.relative(options.watchPath, file) + "\"");
	}
};

//walk file system to repicate the folder structure and init optimization and watcher when done
walk(options.watchPath, function(dir){
		var saveTarget = path.join(options.resultPath, path.relative(options.watchPath, dir));
		fs.mkdir(saveTarget, function(err){
			if(!err){
				console.log("Dirctory Created".green, saveTarget);
			}
		});
	}, function(err, images){
		var totalSaved = 0;
		async.forEachLimit(images, os.cpus().length, function (file, next) {

			var saveTarget = path.join(options.resultPath, path.relative(options.watchPath, file));

			imagemin(file, saveTarget, options, function (err, data) {
				formatFileCompressionLog(err, data, file);
				totalSaved += data.diffSizeRaw;
				process.nextTick(next);
			});
		}, function (err) {
			if (err) {
				console.log(err.red);
			}
			console.log(images.length.toString().bold.green, "existing Files in", options.watchPath.bold,"Compressed".green);
			console.log((totalSaved / 1024 / 1024).toFixed(2).toString().bold.green, "MB saved");

			initChangeWatch();
		});
		
});