import { JupyterFrontEndPlugin } from '@jupyterlab/application';
export declare function contentRequest(cwd: string): any;
export declare function projectInfoRequest(cwd: string): any;
/**
 * A plugin providing file upload status.
 */
export declare const fileUploadStatus: JupyterFrontEndPlugin<void>;
/**
 * Export the plugins as default.
 */
declare const plugins: JupyterFrontEndPlugin<any>[];
export default plugins;
