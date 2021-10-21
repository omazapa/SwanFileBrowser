// Copyright (c) SWAN Development Team.
// Author: Omar.Zapata@cern.ch 2021
import { FilterFileBrowserModel, FileBrowser } from '@jupyterlab/filebrowser';
import { request } from './request';
import { validateSpecModels } from './kernelspec/validate';
import { SwanDirListing } from './listing';
import { JSONObject } from '@lumino/coreutils';
import { showErrorMessage, Dialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
/**
 * SWAN Project options from .swanproject
 * this is required to validated that the project file is not corrupted,
 * two special case the .swanproject file,
 * because it is sending in the request.
 */
export interface ISwanProjectOptions {
  name?: string;
  stack?: string;
  release?: string;
  platform?: string;
  user_script?: string;
  python2?: any;
  python3?: any;
  kernel_dirs?: string[];
}

export class SwanFileBrowserModel extends FilterFileBrowserModel {
  constructor(
    options: FilterFileBrowserModel.IOptions,
    commads: CommandRegistry
  ) {
    super(options);
    this._commands = commads;
    this.kernelSpecSetPathRequest(this.path);
  }

  protected kernelSpecSetPathRequest(path: string): any {
    const dataToSend = { path: path, caller: 'swanfilebrowser' };
    try {
      return request<any>('/swan/kernelspec/set', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      }).then(async (rvalue: { is_project: boolean; path: string }) => {
        return request<any>('/api/kernelspecs', {
          method: 'GET'
        })
          .then(specs => {
            //https://stackoverflow.com/questions/46634876/how-can-i-change-a-readonly-property-in-typescript
            //I need to reset this to null if it is not a project
            //supported by all browsers
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
            // why all this?
            // calling this.manager.services.kernelspecs.refreshSpecs()  was not working when I am outside the project folder
            // it was taking the previuos set of kernels and I need to reset it to null.
            if (rvalue.is_project) {
              const validate_specs = validateSpecModels(specs);
              return Object.defineProperty(
                this.manager.services.kernelspecs,
                'specs',
                {
                  value: validate_specs,
                  configurable: true
                }
              );
            } else {
              return Object.defineProperty(
                this.manager.services.kernelspecs,
                'specs',
                {
                  value: null,
                  configurable: true
                }
              );
            }
          })
          .catch((err: any) => {
            console.log(err);
          });
      });
    } catch (reason) {
      console.error(
        `Error on POST 'swan/kernelspec/set'+ ${dataToSend}.\n${reason}`
      );
    }
  }

  protected projectInfoRequest(project: string): any {
    const uri = 'swan/project/info?caller=swanfilebrowser&path='+project;
    try {
      return request<any>(uri, {
        method: 'GET'
      });
    } catch (reason) {
      console.error(
        `Error on GET ${uri}.\n${reason}`
      );
    }
  }

  protected contentRequest(cwd: string): any {
    try {
      return request<any>('api/contents/' + cwd, {
        method: 'GET'
      }).then(rvalue => {
        return rvalue;
      });
    } catch (reason) {
      console.error(`Error on GET 'api/contents'+ ${cwd}.\n${reason}`);
    }
  }

  protected isValidProject(project_data: JSONObject): boolean {
    for (const tag in this.project_tags) {
      if (!(this.project_tags[tag] in project_data)) {
        return false;
      }
    }
    return true;
  }

  protected getProjectMissingTags(project_data: JSONObject): string[] {
    const missing_tags: string[] = [];
    for (const tag in this.project_tags) {
      if (!(tag in project_data)) {
        missing_tags.push(tag);
      }
    }
    return missing_tags;
  }

  async cd(newValue: string): Promise<void> {
    if (newValue !== '.') {
      const content = await this.contentRequest(newValue);
      if (content.is_project === true) {
        const project_info = await this.projectInfoRequest(newValue);
        const project_data = project_info[
          'project_data'
        ] as ISwanProjectOptions;
        if (this.isValidProject(project_data as JSONObject)) {
          await this.kernelSpecSetPathRequest(newValue);
          return super.cd(newValue);
        } else {
          const okButton = Dialog.okButton({ accept: false });
          await showErrorMessage(
            'Project Error:',
            'Error reading the configuration of project ' +
              project_data?.name +
              ', please click OK to define a new one.',
            [okButton]
          );

          if (okButton.accept) {
            await this._commands
              .execute('swan:edit-project-dialog', {
                name: project_data?.name,
                stack: project_data?.stack,
                release: project_data?.release,
                platform: project_data?.platform,
                user_script: project_data?.user_script,
                corrupted: true
              })
              .catch(message => {
                console.log(message);
              });
          }
          await this.kernelSpecSetPathRequest(this.path);
          return super.cd('.'); // we stay in the current directory to fix the project at the moment
        }
      } else {
        return super.cd(newValue).then(async ()=>{
          await this.kernelSpecSetPathRequest(this.path);
        });
      }
    } else {
      return super.cd(newValue);
    }
  }
  private project_tags: string[] = [
    'name',
    'stack',
    'release',
    'platform',
    'python2',
    'python3',
    'kernel_dirs'
  ];
  private _commands: CommandRegistry;
}

export class SwanFileBrowser extends FileBrowser {
  constructor(options: FileBrowser.IOptions) {
    super(options);
    super.id = options.id;
    const model = (this.model = <SwanFileBrowserModel>options.model);
    const renderer = options.renderer;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.layout.removeWidget(this._listing);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._listing = this.createDirListing({
      model,
      renderer,
      translator: this.translator
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.layout.addWidget(this._listing);
  }

  /**
   * Create the underlying DirListing instance.
   *
   * @param options - The DirListing constructor options.
   *
   * @returns The created DirListing instance.
   */
  protected createDirListing(options: SwanDirListing.IOptions): SwanDirListing {
    return new SwanDirListing(options);
  }

  // public listing: SwanDirListing;
  public model: SwanFileBrowserModel;
}
