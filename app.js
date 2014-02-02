"use strict";

//setup Dependencies
var path = require("path")
	,fs = require("fs")
	,watch = require('node-watch')
	,imagemin = require('imagemin')
	,colors = require('colors');

//TODO: test if need to fist install below on *nix platforms
// install apt-get install libjpeg libjpeg-progs 
var watchPath = path.resolve(__dirname, "../images/Source")
	,resultPath = path.resolve(__dirname,"../images/Result");


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
console.log("compressing images in ", watchPath.bold);


//compress changed image
var compressImage = function(filename){
	var saveTarget = path.join(resultPath, path.relative(watchPath, filename));
	fs.mkdir(path.dirname(saveTarget), function(){
		imagemin(filename, saveTarget, function(){
			console.log("&&&&&&&&done".green);
		});
	});
};

var initChangeWatch = function(){
 	console.log("\n\n===========================".green);
 	console.log("Existing Files in ", watchPath.bold," Compressed\n\n".green);
	console.log("watching ", watchPath.bold, " for changes");
	console.log("press ctrl+c to exit ...");
	
	watch(watchPath, { recursive: true, followSymLinks: true }, filter(/^.(jpg|jpeg|gif|png)$/, compressImage));
};


var filter = function(pattern, fn) {
	return function(filename) {
		if (pattern.test(path.extname(filename).toLowerCase())) {
			fn(filename);
		}
	};
};

//file system walker
var walk = function(dir, onFolderFound, done){
	fs.readdir(dir, function(err, list){
		if(err){
			return done(err);
		}
		var pending = list.length;

		if(!pending){
			return done(null);
		}

		onFolderFound(dir);

		list.forEach(function(file) {
			file = path.join(dir, file);
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, onFolderFound, function(err, res) {
						if(!--pending){
							done(null);
						}
					});
				} else {
					if(!--pending){
						done(null);
					}
				}
			});
		});
	});
};

//walk file system to repicate the folder structure and init optimization and watcher when done
walk(watchPath, function(dir){
	var saveTarget = path.join(resultPath, path.relative(watchPath, dir));
	fs.mkdir(saveTarget, function(err){
		if(!err){
			console.log("Dirctory Created".green, saveTarget);
		}
	});
}, function(){
	imagemin(watchPath, resultPath, initChangeWatch);
});