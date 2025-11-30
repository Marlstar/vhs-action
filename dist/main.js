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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const intaller = __importStar(require("./installer"));
const deps = __importStar(require("./dependencies"));
const fonts = __importStar(require("./fonts"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const version = core.getInput('version');
            const filePath = core.getInput('path');
            // Fail fast if file does not exist.
            if (filePath) {
                if (!fs.existsSync(filePath)) {
                    core.error(`File ${filePath} does not exist`);
                }
                else {
                    // Check that `filePath` is a file, and that we can read it.
                    fs.accessSync(filePath, fs.constants.F_OK);
                    fs.accessSync(filePath, fs.constants.R_OK);
                }
            }
            yield fonts.install();
            yield deps.install();
            const bin = yield intaller.install(version);
            core.info('Adding VHS to PATH');
            core.addPath(path.dirname(bin));
            // Unset the CI variable to prevent Termenv from ignoring terminal ANSI
            // sequences.
            core.exportVariable('CI', '');
            // GitHub Actions support terminal true colors, so we can enable it.
            core.exportVariable('COLORTERM', 'truecolor');
            if (filePath) {
                core.info('Running VHS');
                yield exec.exec(`${bin} ${filePath}`);
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
