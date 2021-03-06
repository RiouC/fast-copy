const fsPromises = require('fs/promises')
const fs = require('fs')
const path = require('path');

const [,, ...cmdArgs] = process.argv;

const bn = path.basename(process.argv[1], '.js');


let options = {'-v': false};


const checkArgsLen = (cmdArgs) => {
    if (cmdArgs.length < 2) {
	console.error('Usage: node ${bn}.js SRC... DEST');
	// throw new Error('Usage: node ${bn}.js SRC... DEST');
	process.exit(1);
    }
}

const checkSources = (sources) => {
    for (let src of sources) {
	if (!fs.existsSync(src)) {
	    console.error(`checkSources : ${bn}: cannot access ${src}: No such file or directory`);
	    process.exit(1);
	}
    }
}

const checkDest = async (destination) => {
    try {
	const statDest = await fsPromises.stat(destination);
	if (!statDest.isDirectory())
	    throw new Error(`${bn}: target '${destination}' is not a directory`);
    } catch (e) {
	if (e.code === 'ENOENT') {
	    // console.log('in e.code === ENOENT')
	    fsPromises.mkdir(destination);
	} else {
	    console.error(`checkDest : ${e.message}`)
	    process.exit(1);
	}
    }
}

const printVerbose = (sources, destination) => {
    console.log(`[VERBOSE] Sources: ${sources.join(' ')}`);
    console.log(`[VERBOSE] Destination: ${destination}`);
}

const fastCopy = async (sources, destination) => {
    for (let src of sources) {
	const statSrc = await fsPromises.stat(src);
	if (statSrc.isDirectory()) {
	    try {
		const files = await fsPromises.readdir(src);
		console.log(`files : ${files}`);
		const proArray = [];
		for (const file of files) {
		    const dirPath = path.dirname(__filename);
		    const srcPath = path.join(dirPath, src, file);
		    const destPath = path.join(dirPath, destination, file);
		    proArray.push(fsPromises.copyFile(srcPath , destPath));
		}
		const results = await Promise.allSettled(proArray);

		for (res of results) {
		    console.log(`status : ${res.status}`)
		    console.log(`value : ${res.value}`)
		}
		// const settledArr = Promise.allSettled(proArray);
		// for (p of settledArr) {
		//     console.log(`status : ${p.status}`)
		//     console.log(`value : ${p.value}`)
		// }
		// const results = await settledArr;
	    } catch (err) {
		console.error(err);
	    }
	}
    }
}


const main = async (cmdArgs, options) => {
    const sources = cmdArgs.slice(0, -1);
    const [destination] = cmdArgs.slice(-1);
    
    checkArgsLen(cmdArgs);
    checkSources(sources);
    await checkDest(destination);

    if (options['-v'])
	printVerbose(sources, destination);

    await fastCopy(sources, destination);
    
    process.exit(0);
}

main(cmdArgs, options);
