"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = install;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const tc = __importStar(require("@actions/tool-cache"));
const cacheName = 'vhs';
function install(version) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Installing VHS ${version}...`);
        const osPlatform = os.platform();
        const osArch = os.arch();
        const token = core.getInput('token');
        const octo = github.getOctokit(token);
        let release;
        if (version === 'latest') {
            core.debug('Getting latest release');
            release = yield octo.rest.repos.getLatestRelease({
                owner: 'charmbracelet',
                repo: 'vhs'
            });
        }
        else {
            core.debug(`Getting release for version ${version}`);
            release = yield octo.rest.repos.getReleaseByTag({
                owner: 'charmbracelet',
                repo: 'vhs',
                tag: version
            });
        }
        version = release.data.tag_name.replace(/^v/, '');
        // find cached version
        const cacheDir = tc.find(cacheName, version);
        if (cacheDir) {
            core.info(`Found cached version ${version}`);
            return Promise.resolve(path.join(cacheDir, osPlatform === 'win32' ? 'vhs.exe' : 'vhs'));
        }
        core.info(`Downloading VHS ${version}...`);
        let platform = osPlatform;
        let arch = osArch;
        let ext = 'tar.gz';
        switch (osArch) {
            case 'x64': {
                arch = 'x86_64';
                break;
            }
            case 'x32': {
                arch = 'i386';
                break;
            }
            case 'arm': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const arm_version = process.config.variables.arm_version;
                arch = arm_version ? 'armv' + arm_version : 'arm';
                break;
            }
        }
        switch (osPlatform) {
            case 'darwin': {
                platform = 'Darwin';
                break;
            }
            case 'win32': {
                platform = 'Windows';
                ext = 'zip';
                break;
            }
            case 'linux': {
                platform = 'Linux';
                break;
            }
        }
        let dlUrl;
        const dirName = `vhs_${version}_${platform}_${arch}`;
        const archiveName = `${dirName}.${ext}`;
        core.debug(`Looking for ${archiveName}`);
        for (const asset of release.data.assets) {
            core.debug(`Checking asset ${asset.name}`);
            if (asset.name === archiveName) {
                dlUrl = asset.url;
                break;
            }
        }
        if (!dlUrl) {
            return Promise.reject(new Error(`Unable to find VHS version ${version} for platform ${platform} and architecture ${arch}`));
        }
        core.info(`Downloading ${dlUrl}...`);
        const dlPath = yield tc.downloadTool(dlUrl, '', `token ${token}`, {
            accept: 'application/octet-stream'
        });
        core.debug(`Downloaded to ${dlPath}`);
        core.info('Extracting VHS...');
        let extPath;
        if (osPlatform == 'win32') {
            extPath = yield tc.extractZip(dlPath);
        }
        else {
            extPath = yield tc.extractTar(dlPath);
        }
        core.debug(`Extracted to ${extPath}`);
        const cachePath = yield tc.cacheDir(extPath, cacheName, version);
        core.debug(`Cached to ${cachePath}`);
        const binPath = path.join(cachePath, dirName, osPlatform == 'win32' ? 'vhs.exe' : 'vhs');
        core.debug(`Bin path is ${binPath}`);
        return Promise.resolve(binPath);
    });
}
