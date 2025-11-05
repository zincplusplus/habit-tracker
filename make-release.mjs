import {readFileSync, writeFileSync} from 'fs'
import fs from 'fs-extra'
import {exec} from 'child_process'

const targetVersion = process.argv[2]
const targetVersionPattern = /^[0-9]+\.[0-9]+\.[0-9]+$/

if (!targetVersionPattern.test(targetVersion)) {
	console.log(
		`${process.argv[2]} is not a valid version number. I was expecting something like 1.0.0`,
	)
	process.exit()
}
// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const {minAppVersion} = manifest
manifest.version = targetVersion
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'))
console.log(`bumped manifest.json to version ${targetVersion}`)

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[targetVersion] = minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))
console.log(`bumped versions.json to version ${targetVersion}`)

async function makeRelease() {
	// make a folder with the files
	const destinationFolder = './release'

	try {
		await fs.remove(destinationFolder)
		console.log(`Removed ${destinationFolder} folder`)

		await fs.ensureDir(destinationFolder)
		console.log(`Created ${destinationFolder} folder`)

		await fs.copy(`./main.js`, `${destinationFolder}/main.js`)
		console.log('main.js copied successfully')

		await fs.copy(`./styles.css`, `${destinationFolder}/styles.css`)
		console.log('styles.css copied successfully')

		await fs.copy(`./manifest.json`, `${destinationFolder}/manifest.json`)
		console.log('manifest.json copied successfully')

		await fs.copy(`./versions.json`, `${destinationFolder}/versions.json`)
		console.log('versions.json copied successfully')

		// open the folder so I can drop it into github
		exec('open ./release')
	} catch (err) {
		console.error('Error:', err)
	}
}

makeRelease()
