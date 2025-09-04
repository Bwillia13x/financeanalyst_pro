#!/usr/bin/env node

/**
 * Release Manager Script
 * Comprehensive release management and versioning
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReleaseManager {
  constructor() {
    this.config = this.loadConfig();
    this.releaseType = process.argv[2] || 'patch';
    this.startTime = new Date();
  }

  loadConfig() {
    const configPath = path.join(__dirname, '..', 'config', 'release.json');

    if (!fs.existsSync(configPath)) {
      console.warn('⚠️  Release config not found, using defaults');
      return {
        versioning: {
          format: 'semver',
          prerelease: false
        },
        changelog: {
          enabled: true,
          categories: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
        },
        notifications: {
          slack: false,
          email: false
        },
        git: {
          requireClean: true,
          createTag: true,
          pushTag: true
        },
        artifacts: {
          create: true,
          retain: 10
        }
      };
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  async createRelease() {
    try {
      console.log(`🚀 Starting ${this.releaseType} release...`);
      console.log(`📅 Start time: ${this.startTime.toISOString()}`);

      // Validate prerequisites
      await this.validatePrerequisites();

      // Determine version
      const newVersion = await this.calculateVersion();

      // Update version files
      await this.updateVersionFiles(newVersion);

      // Generate changelog
      if (this.config.changelog.enabled) {
        await this.generateChangelog(newVersion);
      }

      // Run tests
      await this.runReleaseTests();

      // Build artifacts
      if (this.config.artifacts.create) {
        await this.buildArtifacts(newVersion);
      }

      // Create git tag and commit
      if (this.config.git.createTag) {
        await this.createGitRelease(newVersion);
      }

      // Update release metadata
      await this.updateReleaseMetadata(newVersion);

      // Send notifications
      await this.sendReleaseNotifications(newVersion);

      const duration = (new Date() - this.startTime) / 1000;
      console.log(`✅ Release ${newVersion} created successfully in ${duration.toFixed(2)}s`);
    } catch (error) {
      console.error(`❌ Release creation failed:`, error.message);

      // Cleanup on failure
      await this.cleanupFailedRelease();

      process.exit(1);
    }
  }

  async validatePrerequisites() {
    console.log('🔍 Validating release prerequisites...');

    // Check git status
    if (this.config.git.requireClean) {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        throw new Error('Working directory is not clean. Please commit or stash changes.');
      }
    }

    // Check if on main/develop branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const allowedBranches = ['main', 'develop', 'staging'];

    if (!allowedBranches.includes(currentBranch)) {
      throw new Error(`Releases can only be created from: ${allowedBranches.join(', ')}`);
    }

    // Check package.json
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    if (!packageJson.version) {
      throw new Error('package.json missing version field');
    }

    // Check for required files
    const requiredFiles = ['README.md', 'package.json', 'src/'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(__dirname, '..', file))) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    console.log('✅ Prerequisites validated');
  }

  async calculateVersion() {
    console.log('🔢 Calculating new version...');

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    const currentVersion = packageJson.version;

    let newVersion;

    if (this.config.versioning.format === 'semver') {
      newVersion = this.bumpSemverVersion(currentVersion, this.releaseType);
    } else {
      // Custom versioning logic
      const versionNum = parseInt(currentVersion.split('.').pop()) + 1;
      newVersion = `${currentVersion.split('.').slice(0, -1).join('.')}.${versionNum}`;
    }

    console.log(`📈 Version: ${currentVersion} → ${newVersion}`);
    return newVersion;
  }

  bumpSemverVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error(`Unknown release type: ${type}`);
    }
  }

  async updateVersionFiles(newVersion) {
    console.log('📝 Updating version files...');

    const filesToUpdate = ['package.json', 'package-lock.json', 'src/version.js'];

    for (const file of filesToUpdate) {
      const filePath = path.join(__dirname, '..', file);

      if (fs.existsSync(filePath)) {
        if (file.endsWith('.json')) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          content.version = newVersion;
          fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
        } else if (file.endsWith('.js')) {
          // Create or update version file
          const versionContent = `export const VERSION = '${newVersion}';\nexport const BUILD_DATE = '${new Date().toISOString()}';\n`;
          fs.writeFileSync(filePath, versionContent);
        }
      }
    }

    console.log('✅ Version files updated');
  }

  async generateChangelog(newVersion) {
    console.log('📋 Generating changelog...');

    try {
      // Get commit history since last tag
      const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
        encoding: 'utf8'
      }).trim();
      const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';

      const commits = execSync(`git log ${commitRange} --oneline --pretty=format:"%h %s"`, {
        encoding: 'utf8'
      })
        .split('\n')
        .filter(line => line.trim());

      // Categorize commits
      const categorizedCommits = this.categorizeCommits(commits);

      // Generate changelog content
      const changelogContent = this.formatChangelog(newVersion, categorizedCommits);

      // Update CHANGELOG.md
      const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
      const existingContent = fs.existsSync(changelogPath)
        ? fs.readFileSync(changelogPath, 'utf8')
        : '';

      const newContent = changelogContent + '\n' + existingContent;
      fs.writeFileSync(changelogPath, newContent);

      console.log('✅ Changelog generated');
    } catch (error) {
      console.warn('⚠️  Changelog generation failed:', error.message);
    }
  }

  categorizeCommits(commits) {
    const categories = {};

    for (const category of this.config.changelog.categories) {
      categories[category] = [];
    }

    for (const commit of commits) {
      const [hash, ...messageParts] = commit.split(' ');
      const message = messageParts.join(' ');

      let categorized = false;
      for (const category of this.config.changelog.categories) {
        if (
          message.toLowerCase().startsWith(category + ':') ||
          message.toLowerCase().startsWith(category + '(')
        ) {
          categories[category].push({
            hash,
            message: message.substring(category.length + 1).trim()
          });
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories['chore'] = categories['chore'] || [];
        categories['chore'].push({ hash, message });
      }
    }

    return categories;
  }

  formatChangelog(version, categories) {
    const date = new Date().toISOString().split('T')[0];
    let changelog = `# ${version} (${date})\n\n`;

    for (const [category, commits] of Object.entries(categories)) {
      if (commits.length > 0) {
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + 's';
        changelog += `## ${categoryTitle}\n`;

        for (const commit of commits) {
          changelog += `- ${commit.message} (${commit.hash})\n`;
        }

        changelog += '\n';
      }
    }

    return changelog;
  }

  async runReleaseTests() {
    console.log('🧪 Running release tests...');

    try {
      // Run unit tests
      execSync('npm run test:unit', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Run integration tests
      execSync('npm run test:integration', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Run smoke tests
      execSync('npm run test:smoke', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      console.log('✅ Release tests passed');
    } catch (error) {
      throw new Error(`Release tests failed: ${error.message}`);
    }
  }

  async buildArtifacts(newVersion) {
    console.log('📦 Building release artifacts...');

    try {
      // Clean previous builds
      execSync('npm run clean', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Build production version
      execSync('npm run build:prod', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Build Docker image
      execSync('npm run build:docker', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Create release archive
      const archiveName = `financeanalyst-pro-${newVersion}`;
      const archivePath = `/tmp/${archiveName}.tar.gz`;

      execSync(`tar -czf ${archivePath} -C ${path.join(__dirname, '..')} .`, {
        stdio: 'inherit'
      });

      console.log(`✅ Release artifacts built: ${archiveName}.tar.gz`);
    } catch (error) {
      throw new Error(`Artifact build failed: ${error.message}`);
    }
  }

  async createGitRelease(newVersion) {
    console.log('🏷️ Creating git release...');

    try {
      // Add changes
      execSync('git add .', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Create commit
      execSync(`git commit -m "Release ${newVersion}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Create tag
      execSync(`git tag -a v${newVersion} -m "Release ${newVersion}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Push changes and tags
      if (this.config.git.pushTag) {
        execSync('git push origin HEAD', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });

        execSync('git push origin --tags', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });
      }

      console.log('✅ Git release created');
    } catch (error) {
      throw new Error(`Git release failed: ${error.message}`);
    }
  }

  async updateReleaseMetadata(newVersion) {
    console.log('📝 Updating release metadata...');

    try {
      const metadata = {
        version: newVersion,
        created: new Date().toISOString(),
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        type: this.releaseType,
        artifacts: [
          `financeanalyst-pro-${newVersion}.tar.gz`,
          `financeanalyst-pro-${newVersion}-docker.tar`
        ],
        checksums: {}
      };

      // Calculate checksums for artifacts
      const artifactsDir = '/tmp';
      const artifacts = [
        `financeanalyst-pro-${newVersion}.tar.gz`,
        `financeanalyst-pro-${newVersion}-docker.tar`
      ];

      for (const artifact of artifacts) {
        const artifactPath = path.join(artifactsDir, artifact);
        if (fs.existsSync(artifactPath)) {
          const checksum = execSync(`sha256sum ${artifactPath} | cut -d' ' -f1`, {
            encoding: 'utf8'
          }).trim();
          metadata.checksums[artifact] = checksum;
        }
      }

      // Save metadata
      const metadataPath = path.join(__dirname, '..', 'releases', `${newVersion}.json`);
      fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      console.log('✅ Release metadata updated');
    } catch (error) {
      console.warn('⚠️  Release metadata update failed:', error.message);
    }
  }

  async sendReleaseNotifications(newVersion) {
    console.log('📢 Sending release notifications...');

    try {
      const notification = {
        type: 'release',
        version: newVersion,
        timestamp: new Date().toISOString(),
        releaseType: this.releaseType,
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
      };

      console.log('📧 Release notification:', JSON.stringify(notification, null, 2));

      // In production, this would send to Slack, email, etc.
    } catch (error) {
      console.warn('⚠️  Release notification failed:', error.message);
    }
  }

  async cleanupFailedRelease() {
    console.log('🧹 Cleaning up failed release...');

    try {
      // Reset git changes if any
      execSync('git reset --hard HEAD~1 2>/dev/null || true', {
        cwd: path.join(__dirname, '..')
      });

      // Remove any created tags
      const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
        encoding: 'utf8'
      }).trim();
      if (latestTag) {
        execSync(`git tag -d ${latestTag} 2>/dev/null || true`, {
          cwd: path.join(__dirname, '..')
        });
      }

      console.log('✅ Failed release cleanup completed');
    } catch (error) {
      console.warn('⚠️  Failed release cleanup failed:', error.message);
    }
  }
}

// Run release manager
const releaseManager = new ReleaseManager();

// Validate release type
const validTypes = ['patch', 'minor', 'major'];
if (!validTypes.includes(releaseManager.releaseType)) {
  console.error(`❌ Invalid release type: ${releaseManager.releaseType}`);
  console.error(`Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

releaseManager.createRelease().catch(error => {
  console.error('💥 Release manager failed:', error);
  process.exit(1);
});
