const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function bumpVersion(newVersion, newBuildNumber) {
    console.log(`🚀 Bumping version to ${newVersion} (Build ${newBuildNumber})...`);

    // 1. Update app.json
    const appJsonPath = path.join(rootDir, 'app.json');
    if (fs.existsSync(appJsonPath)) {
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        appJson.expo.version = newVersion;
        if (appJson.expo.ios) appJson.expo.ios.buildNumber = String(newBuildNumber);
        if (appJson.expo.android) appJson.expo.android.versionCode = Number(newBuildNumber);
        fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
        console.log('✅ Updated app.json');
    }

    // 2. Update package.json
    const pkgJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pkgJson.version = newVersion;
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
        console.log('✅ Updated package.json');
    }

    // 3. Update Android build.gradle
    const gradlePath = path.join(rootDir, 'android/app/build.gradle');
    if (fs.existsSync(gradlePath)) {
        let content = fs.readFileSync(gradlePath, 'utf8');
        content = content.replace(/versionCode \d+/g, `versionCode ${newBuildNumber}`);
        content = content.replace(/versionName "[^"]+"/g, `versionName "${newVersion}"`);
        fs.writeFileSync(gradlePath, content);
        console.log('✅ Updated android/app/build.gradle');
    }

    // 4. Update iOS project.pbxproj
    const iosDir = path.join(rootDir, 'ios');
    if (fs.existsSync(iosDir)) {
        const projects = fs.readdirSync(iosDir).filter(f => f.endsWith('.xcodeproj'));
        projects.forEach(project => {
            const pbxprojPath = path.join(iosDir, project, 'project.pbxproj');
            if (fs.existsSync(pbxprojPath)) {
                let content = fs.readFileSync(pbxprojPath, 'utf8');
                content = content.replace(/MARKETING_VERSION = [^;]+/g, `MARKETING_VERSION = ${newVersion}`);
                content = content.replace(/CURRENT_PROJECT_VERSION = [^;]+/g, `CURRENT_PROJECT_VERSION = ${newBuildNumber}`);
                fs.writeFileSync(pbxprojPath, content);
                console.log(`✅ Updated ${project}/project.pbxproj`);
            }
        });
    }

    // 5. Run Expo Prebuild to sync Info.plist and other native files
    try {
        console.log('🔄 Running expo prebuild to sync native files...');
        execSync('CI=1 npx expo prebuild --platform ios', { stdio: 'inherit' });
        console.log('✅ Native files synced via expo prebuild');
    } catch (e) {
        console.warn('⚠️ Expo prebuild failed or skipped. You might need to run it manually.');
    }

    console.log('\n✨ Version bump complete!');
}

// Simple CLI handling
const args = process.argv.slice(2);
let targetVersion = args[0];
let targetBuild = args[1];

if (!targetVersion || !targetBuild) {
    // Try to auto-increment if no args provided
    const appJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'app.json'), 'utf8'));
    const currentVersion = appJson.expo.version;
    const currentBuild = parseInt(appJson.expo.ios.buildNumber || appJson.expo.android.versionCode || '1');

    if (!targetVersion) {
        const parts = currentVersion.split('.');
        parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
        targetVersion = parts.join('.');
    }
    if (!targetBuild) {
        targetBuild = currentBuild + 1;
    }
}

bumpVersion(targetVersion, targetBuild);
