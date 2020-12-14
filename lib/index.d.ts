import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { FileBrowserModel, FileBrowser } from '@jupyterlab/filebrowser';
export declare class SwanFileBrowserModel extends FileBrowserModel {
    constructor(options: FileBrowserModel.IOptions);
    cd(newValue?: string): Promise<void>;
}
export declare class SwanFileBrowser extends FileBrowser {
    constructor(options: FileBrowser.IOptions);
}
/**
 * A plugin providing file upload status.
 */
export declare const fileUploadStatus: JupyterFrontEndPlugin<void>;
/**
 * Export the plugins as default.
 */
declare const plugins: JupyterFrontEndPlugin<any>[];
export default plugins;
