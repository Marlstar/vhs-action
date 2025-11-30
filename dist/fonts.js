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
const fs = __importStar(require("fs/promises"));
const tc = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const github = __importStar(require("@actions/github"));
const glob = __importStar(require("@actions/glob"));
const specialNames = {
    '%assetNameName%': (asset) => path.parse(asset.name).name
};
const nerdFonts = [
    {
        name: 'JetBrainsMono.zip',
        isDefault: true
    },
    {
        name: 'BitstreamVeraSansMono.zip'
    },
    {
        name: 'DejaVuSansMono.zip'
    },
    {
        name: 'FiraCode.zip'
    },
    {
        name: 'Hack.zip'
    },
    {
        name: 'IBMPlexMono.zip'
    },
    {
        name: 'Inconsolata.zip'
    },
    {
        name: 'InconsolataGo.zip'
    },
    {
        name: 'LiberationMono.zip'
    },
    {
        name: 'SourceCodePro.zip'
    },
    {
        name: 'UbuntuMono.zip'
    }
];
const googleFonts = [
    {
        name: 'Source Code Pro',
        pattern: 'SourceCodePro*.ttf'
    },
    {
        name: 'Inconsolata',
        pattern: 'Inconsolata*.ttf'
    },
    {
        name: 'Noto Sans Mono',
        pattern: 'NotoSansMono*.ttf'
    },
    {
        name: 'Roboto Mono',
        pattern: 'RobotoMono*.ttf'
    },
    {
        name: 'Ubuntu Mono',
        pattern: 'UbuntuMono*.ttf'
    }
];
const githubFonts = [
    {
        owner: 'JetBrains',
        repo: 'JetBrainsMono',
        isDefault: true,
        assetStartsWith: 'JetBrainsMono',
        assetEndsWith: '.zip',
        staticPath: ['fonts', 'ttf']
    },
    {
        owner: 'dejavu-fonts',
        repo: 'dejavu-fonts',
        assetStartsWith: 'dejavu-fonts-ttf',
        assetEndsWith: '.zip',
        staticPath: ['%assetNameName%', 'ttf']
    },
    {
        owner: 'tonsky',
        repo: 'FiraCode',
        assetStartsWith: 'Fira_Code',
        assetEndsWith: '.zip',
        staticPath: ['ttf']
    },
    {
        owner: 'source-foundry',
        repo: 'Hack',
        assetStartsWith: 'Hack',
        assetEndsWith: '-ttf.zip',
        staticPath: []
    }
];
const fontPath = {
    linux: `${os.homedir()}/.local/share/fonts`,
    darwin: `${os.homedir()}/Library/Fonts`,
    win32: '%LocalAppData%\\Microsoft\\Windows\\Fonts'
};
const installExtraFonts = core.getInput('install-fonts') === 'true';
const token = core.getInput('token');
const octo = github.getOctokit(token);
const osPlatform = os.platform();
const ps1Install = `$fonts = (New-Object -ComObject Shell.Application).Namespace(0x14)
Get-ChildItem -Recurse -include *.ttf | % { $fonts.CopyHere($_.fullname) }`;
const ps1InstallPath = path.join(os.homedir(), 'install.ps1');
function install() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Installing ${installExtraFonts ? 'all' : 'default'} fonts...`);
        if (osPlatform === 'linux' || osPlatform === 'darwin') {
            core.debug(`Creating font directory ${fontPath[osPlatform]}`);
            yield fs.mkdir(fontPath[osPlatform], { recursive: true });
        }
        if (osPlatform === 'win32') {
            // Create the install script
            yield fs.writeFile(ps1InstallPath, ps1Install);
        }
        for (const font of googleFonts) {
            if (font.isDefault || installExtraFonts) {
                yield installGoogleFont(font);
            }
        }
        for (const font of githubFonts) {
            if (font.isDefault || installExtraFonts) {
                yield installGithubFont(font);
            }
        }
        for (const font of nerdFonts) {
            if (font.isDefault || installExtraFonts) {
                yield installNerdFont(font);
            }
        }
        if (installExtraFonts) {
            yield liberation();
        }
        if (osPlatform === 'linux') {
            yield exec.exec('fc-cache', ['-f', '-v']);
        }
    });
}
function installFonts(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = (yield fs.readdir(dir)).filter(file => file.endsWith('.ttf'));
        // Windows installs all fonts at once
        if (osPlatform === 'win32') {
            return installWindowsFont(path.resolve(dir)).then(() => []);
        }
        return Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            const filename = path.basename(file);
            const absolutePath = path.resolve(dir, filename);
            switch (osPlatform) {
                case 'linux':
                case 'darwin': {
                    return fs.copyFile(absolutePath, path.join(fontPath[osPlatform], filename));
                }
            }
            return Promise.reject(new Error('Unsupported platform'));
        })));
    });
}
// based on https://superuser.com/a/788759/985112
function installWindowsFont(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Running PS1 install script for ${dirPath}`);
        return exec.exec('powershell.exe', ['-ExecutionPolicy', 'Bypass', ps1InstallPath], {
            cwd: dirPath
        });
    });
}
function installGithubFont(font) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Installing ${font.repo}`);
        const cacheDir = tc.find(font.repo, 'latest');
        if (cacheDir) {
            core.info(`Found cached version of ${font.repo}`);
            return installFonts(cacheDir);
        }
        const release = yield octo.rest.repos.getLatestRelease({
            owner: font.owner,
            repo: font.repo
        });
        for (const asset of release.data.assets) {
            const url = asset.url;
            const name = asset.name;
            if (name.startsWith(font.assetStartsWith) &&
                name.endsWith(font.assetEndsWith)) {
                core.info(`Downloading ${font.repo}`);
                const zipPath = yield tc.downloadTool(url, '', `token ${token}`, {
                    accept: 'application/octet-stream'
                });
                const unzipPath = yield tc.extractZip(zipPath);
                const staticPath = font.staticPath.map(p => {
                    return sanitizeSpecial(p, asset);
                });
                const cacheDir = yield tc.cacheDir(path.join(unzipPath, ...staticPath), font.repo, 'latest');
                return installFonts(cacheDir);
            }
        }
        return Promise.reject(new Error(`Could not find ${font.repo}`));
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nerdFontsRelease;
function installNerdFont(font) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!nerdFontsRelease) {
            nerdFontsRelease = yield octo.rest.repos.getLatestRelease({
                owner: 'ryanoasis',
                repo: 'nerd-fonts'
            });
        }
        const fontName = `${path.parse(font.name).name}-nerd`;
        for (const asset of nerdFontsRelease.data.assets) {
            const url = asset.url;
            const name = asset.name;
            if (font.name === name) {
                core.info(`Installing ${fontName}`);
                let cacheDir = tc.find(fontName, 'latest');
                if (cacheDir) {
                    core.info(`Found cached version of ${fontName}`);
                    return installFonts(cacheDir);
                }
                core.info(`Downloading ${fontName}`);
                const zipPath = yield tc.downloadTool(url, '', `token ${token}`, {
                    accept: 'application/octet-stream'
                });
                const unzipPath = yield tc.extractZip(zipPath);
                cacheDir = yield tc.cacheDir(unzipPath, fontName, 'latest');
                return installFonts(cacheDir);
            }
        }
        return Promise.reject(new Error(`Could not find ${fontName}`));
    });
}
let googleFontsPath = '';
function installGoogleFont(font) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheDir = tc.find(font.name, 'latest');
        if (cacheDir) {
            core.info(`Found cached version of ${font.name}`);
            return installFonts(cacheDir);
        }
        if (!googleFontsPath) {
            core.info('Downloading Google Fonts repository archive');
            const zipPath = yield tc.downloadTool('https://github.com/google/fonts/archive/refs/heads/main.zip', '', token);
            googleFontsPath = yield tc.extractZip(zipPath);
        }
        core.info(`Installing ${font.name}`);
        const globber = yield glob.create(path.join(googleFontsPath, '**', font.pattern));
        const files = yield globber.glob();
        const cacheDirs = {};
        for (const file of files) {
            if (!cacheDirs[font.name]) {
                cacheDirs[font.name] = yield tc.cacheDir(path.dirname(file), font.name, 'latest');
            }
        }
        return Promise.all(Object.keys(cacheDirs).map((key) => __awaiter(this, void 0, void 0, function* () {
            yield installFonts(cacheDirs[key]);
        })));
    });
}
function liberation() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info('Installing Liberation Fonts');
        let cacheDir = tc.find('liberation', 'latest');
        if (cacheDir) {
            core.info(`Found cached version of Liberation`);
            return installFonts(cacheDir);
        }
        core.info(`Downloading Liberation`);
        // FIXME liberation-fonts don't upload their fonts to GitHub releases, instead in the release description :/
        const zipPath = yield tc.downloadTool('https://github.com/liberationfonts/liberation-fonts/files/7261482/liberation-fonts-ttf-2.1.5.tar.gz', '', token);
        const unzipPath = yield tc.extractTar(zipPath);
        cacheDir = yield tc.cacheDir(unzipPath, 'liberation', 'latest');
        return installFonts(cacheDir);
    });
}
// DejaVu fonts have a different structure than the other fonts. The zip
// contains a root folder with the same zip file name without the extension.
function sanitizeSpecial(name, asset) {
    for (const [key, value] of Object.entries(specialNames)) {
        name = name.replace(key, value(asset));
    }
    return name;
}
