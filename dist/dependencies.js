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
exports.installTtyd = installTtyd;
exports.installTtydBrewHead = installTtydBrewHead;
exports.installLatestFfmpeg = installLatestFfmpeg;
exports.installFfmpeg = installFfmpeg;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const tc = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const github = __importStar(require("@actions/github"));
const httpm = __importStar(require("@actions/http-client"));
function install() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Installing dependencies...`);
        yield installTtyd();
        // await installLatestFfmpeg()
        return Promise.resolve();
    });
}
function installTtyd(version) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!version) {
            version = 'latest';
        }
        version = version.replace(/^v/, '');
        core.info(`Installing ttyd ${version}...`);
        const osPlatform = os.platform();
        const token = core.getInput('token');
        const octo = github.getOctokit(token);
        const cacheFile = tc.find('ttyd', version);
        if (cacheFile) {
            core.info(`Found cached version ${version}`);
            if (['darwin', 'linux'].includes(osPlatform)) {
                fs.chmodSync(cacheFile, '755');
            }
            core.addPath(path.dirname(cacheFile));
            return Promise.resolve(cacheFile);
        }
        let binPath;
        let url;
        let release;
        if (version === 'latest') {
            core.debug('Getting latest release');
            release = yield octo.rest.repos.getLatestRelease({
                owner: 'tsl0922',
                repo: 'ttyd'
            });
        }
        else {
            core.debug(`Getting release for version ${version}`);
            release = yield octo.rest.repos.getReleaseByTag({
                owner: 'tsl0922',
                repo: 'ttyd',
                tag: version
            });
        }
        switch (osPlatform) {
            case 'win32': {
                url = (_a = release.data.assets.find(asset => asset.name.endsWith('win10.exe') || asset.name.endsWith('win32.exe'))) === null || _a === void 0 ? void 0 : _a.browser_download_url;
                core.debug(`Installing ttyd ${version} on Windows from ${url}`);
                break;
            }
            case 'linux': {
                url = (_b = release.data.assets.find(asset => asset.name.endsWith('x86_64'))) === null || _b === void 0 ? void 0 : _b.browser_download_url;
                core.debug(`Installing ttyd ${version} on Linux from ${url}`);
                break;
            }
            case 'darwin': {
                core.debug(`Installing ttyd from HEAD on MacOs`);
                yield exec.exec('brew', ['update', '--quiet']);
                const args = ['install', 'ttyd'];
                if (version === 'latest') {
                    args.push('--HEAD');
                }
                core.debug(`MacOS ttyd does not support versioning`);
                yield exec.exec('brew', args);
                const brewPrefixOutput = yield exec.getExecOutput('brew', ['--prefix']);
                const brewPrefix = brewPrefixOutput.stdout.trim();
                const cachePath = yield tc.cacheFile(`${brewPrefix}/bin/ttyd`, 'ttyd', 'ttyd', version);
                return Promise.resolve(path.join(cachePath, 'ttyd'));
            }
            default: {
                return Promise.reject(new Error(`Unsupported platform: ${osPlatform}`));
            }
        }
        if (url) {
            binPath = yield tc.downloadTool(url, '', `token ${token}`, {
                accept: 'application/octet-stream'
            });
            core.debug(`Downloaded ttyd to ${binPath}`);
            const cacheDir = yield tc.cacheFile(binPath, `ttyd${osPlatform === 'win32' ? '.exe' : ''}`, 'ttyd', 
            // FIXME fetch version
            version);
            core.debug(`Cached ttyd in ${cacheDir}`);
            core.addPath(cacheDir);
            if (['darwin', 'linux'].includes(osPlatform)) {
                fs.chmodSync(path.join(cacheDir, 'ttyd'), '755');
            }
            return Promise.resolve(path.join(cacheDir, `ttyd${osPlatform === 'win32' ? '.exe' : ''}`));
        }
        return Promise.reject(new Error(`Could not install ttyd`));
    });
}
function installTtydBrewHead() {
    return __awaiter(this, void 0, void 0, function* () {
        // Install ttyd from source
        yield exec.exec('git', ['clone', 'https://github.com/tsl0922/ttyd']);
        yield exec.exec('cd', ['ttyd']);
        yield exec.exec('brew', ['update', '--quiet']);
        yield exec.exec('brew', [
            'install',
            'cmake',
            'json-c',
            'libevent',
            'libuv',
            'libwebsockets',
            'openssl@1.1'
        ]);
        yield exec.exec('cmake', [
            '-S',
            '.',
            '-B',
            'build',
            '-DOPENSSL_ROOT_DIR=$(brew --prefix)/opt/openssl@1.1/',
            '-Dlibwebsockets_DIR=$(brew --prefix)/lib/cmake/libwebsockets'
        ]);
        yield exec.exec('cmake', ['--build', 'build']);
        yield exec.exec('cmake', ['--install', 'build']);
        return Promise.resolve();
    });
}
function installLatestFfmpeg() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Installing latest ffmpeg...`);
        const http = new httpm.HttpClient('vhs-action');
        const osPlatform = os.platform();
        const token = core.getInput('token');
        const octo = github.getOctokit(token);
        const cacheDir = tc.find('ffmpeg', 'latest');
        if (cacheDir) {
            core.info(`Found cached version latest`);
            const binPath = path.join(cacheDir, osPlatform === 'win32' ? 'bin' : '');
            core.addPath(binPath);
            return Promise.resolve(path.join(binPath, `ffmpeg${osPlatform === 'win32' ? '.exe' : ''}`));
        }
        const flags = [];
        let url;
        const version = 'latest';
        let release;
        let extract;
        switch (osPlatform) {
            case 'linux': {
                // Use https://github.com/BtbN/FFmpeg-Builds builds
                release = yield octo.rest.repos.getLatestRelease({
                    owner: 'BtbN',
                    repo: 'FFmpeg-Builds'
                });
                for (const asset of release.data.assets) {
                    // ffmpeg-n5.1-latest-linux64-gpl-5.1.tar.xz
                    if (asset.name.startsWith('ffmpeg-n5.1') &&
                        asset.name.includes('linux64-gpl-5.1') &&
                        asset.name.endsWith('.tar.xz')) {
                        url = asset.browser_download_url;
                        break;
                    }
                }
                extract = tc.extractTar;
                flags.push('xJ', '--strip-components=1');
                break;
            }
            case 'win32': {
                // Use https://github.com/BtbN/FFmpeg-Builds builds
                release = yield octo.rest.repos.getLatestRelease({
                    owner: 'BtbN',
                    repo: 'FFmpeg-Builds'
                });
                for (const asset of release.data.assets) {
                    // ffmpeg-n5.1-latest-linux64-gpl-5.1.tar.xz
                    if (asset.name.startsWith('ffmpeg-n5.1') &&
                        asset.name.includes('win64-gpl-5.1') &&
                        asset.name.endsWith('.zip')) {
                        url = asset.browser_download_url;
                        break;
                    }
                }
                extract = tc.extractZip;
                break;
            }
            case 'darwin': {
                // Use https://evermeet.cx/ffmpeg/ builds
                const resp = yield http.getJson('https://evermeet.cx/ffmpeg/info/ffmpeg/release');
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                // version = resp.result!.version
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                url = resp.result.download.zip.url;
                extract = tc.extractZip;
                break;
            }
            default: {
                return Promise.reject(new Error(`Unsupported platform: ${osPlatform}`));
            }
        }
        if (url) {
            const dlPath = yield tc.downloadTool(url);
            core.debug(`Downloaded ffmpeg to ${dlPath}`);
            const cachePath = yield tc.cacheDir(yield extract(dlPath, '', flags), 'ffmpeg', version);
            switch (osPlatform) {
                case 'linux':
                case 'win32': {
                    const binDir = path.join(cachePath, 'bin');
                    core.addPath(binDir);
                    return Promise.resolve(path.join(binDir, `ffmpeg${osPlatform === 'win32' ? '.exe' : ''}`));
                }
                default: {
                    core.addPath(cachePath);
                    return Promise.resolve(path.join(cachePath, 'ffmpeg'));
                }
            }
        }
        return Promise.reject(new Error('Failed to install ffmpeg'));
    });
}
function installFfmpeg() {
    return __awaiter(this, void 0, void 0, function* () {
        const osPlatform = os.platform();
        switch (osPlatform) {
            case 'linux': {
                yield exec.exec('sudo', ['apt-get', 'update']);
                yield exec.exec('sudo', ['apt-get', 'install', 'ffmpeg']);
                break;
            }
            case 'win32': {
                yield exec.exec('choco', ['install', 'ffmpeg']);
                break;
            }
            case 'darwin': {
                yield exec.exec('brew', ['update', '--quiet']);
                yield exec.exec('brew', ['install', 'ffmpeg']);
                break;
            }
            default: {
                return Promise.reject(new Error(`Unsupported platform: ${osPlatform}`));
            }
        }
        return Promise.resolve();
    });
}
