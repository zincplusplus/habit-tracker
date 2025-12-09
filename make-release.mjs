import {readFileSync, writeFileSync} from 'fs'
import fs from 'fs-extra'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

const versionArg = process.argv[2]

// Read current version from manifest
const currentManifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const currentVersion = currentManifest.version
const [major, minor, patch] = currentVersion.split('.').map(Number)

let targetVersion

// Check if it's a semantic version type or explicit version
const targetVersionPattern = /^[0-9]+\.[0-9]+\.[0-9]+$/
if (targetVersionPattern.test(versionArg)) {
	// Explicit version provided (existing behavior)
	targetVersion = versionArg
} else if (versionArg === 'major') {
	targetVersion = `${major + 1}.0.0`
} else if (versionArg === 'minor') {
	targetVersion = `${major}.${minor + 1}.0`
} else if (versionArg === 'fix' || versionArg === 'patch') {
	targetVersion = `${major}.${minor}.${patch + 1}`
} else {
	console.log(`Invalid argument: ${versionArg}`)
	console.log('')
	console.log('Usage: node make-release.mjs <version>')
	console.log('')
	console.log('Where <version> can be:')
	console.log('  major         - Bump major version (e.g., 2.2.0 → 3.0.0)')
	console.log('  minor         - Bump minor version (e.g., 2.2.0 → 2.3.0)')
	console.log('  fix | patch   - Bump patch version (e.g., 2.2.0 → 2.2.1)')
	console.log('  1.2.3         - Set specific version')
	console.log('')
	console.log(`Current version: ${currentVersion}`)
	process.exit(1)
}

console.log(`Bumping version from ${currentVersion} to ${targetVersion}`)
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
	try {
		// Build the project first
		console.log('Building project...')
		await execAsync('npm run build')
		console.log('Build completed successfully')

		// make a folder with the files
		const destinationFolder = './release'

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

		// Create git tag
		console.log('Creating git tag...')
		await execAsync(`git tag ${targetVersion}`)
		console.log(`✅ Git tag ${targetVersion} created successfully`)
		console.log(`\nTo push the tag when ready, run:`)
		console.log(`  git push origin ${targetVersion}`)

		// open the folder so I can drop it into github
		exec('open ./release')
	} catch (err) {
		console.error('Error:', err)
		process.exit(1)
	}
}

makeRelease()
