// Copyright (c) SWAN Development Team.
// Author: Omar.Zapata@cern.ch 2021
import { FilterFileBrowserModel, FileBrowser } from '@jupyterlab/filebrowser';
import { request } from './request';
import { validateSpecModels } from './kernelspec/validate';
import { SwanDirListing } from './listing';
import { JSONObject } from '@lumino/coreutils';
import { showErrorMessage, Dialog} from '@jupyterlab/apputils';

/**
 * SWAN Project options from .swanproject file plus readme 
 * this is required to validated that the project file is not corrupted,
 * two special cases are the readme and name that is not part of the the .swanproject file, 
 * but it is sent in the request.
 */
export interface ISwanProjectOptions{
  name?: string;
  stack?: string;
  release?: string;
  platform?: string;
  user_script?: string;
  readme?: string | null | undefined;
  python2?: any;
  python3?: any;
  kernel_dirs?: string[];
}

export class SwanFileBrowserModel extends FilterFileBrowserModel {
  constructor(options: FilterFileBrowserModel.IOptions) {
    super(options);
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
    const dataToSend = { path: project, caller:"swanfilebrowser"};
    try {
      return request<any>('swan/project/info', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
    } catch (reason) {
      console.error(
        `Error on POST 'swan/project/info'+ ${dataToSend}.\n${reason}`
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

  protected isValidProject(project_data:JSONObject):boolean {    
    for(const tag in this.project_tags)
    {
      if (!(this.project_tags[tag] in project_data)) {
        console.log(this.project_tags[tag])
        return false;
      }
    }
    return true; 
  }

  protected getProjectMissingTags(project_data:JSONObject):string[] {
    let missing_tags:string[] = []
    for(const tag in this.project_tags)
    {
      if (!(tag in project_data))
      { 
        missing_tags.push(tag)
      }
    }
    return missing_tags;
  }


  async cd(newValue: string): Promise<void> {
    if(newValue !== '.')
    {
      let content = await this.contentRequest(newValue);
      if(content.is_project == true)
      {
        let project_info = await this.projectInfoRequest(newValue);
        console.log("INSIDE PROJECT");
        const project_data = project_info['project_data'] as ISwanProjectOptions;
        if(this.isValidProject(project_data as JSONObject))
        {
          this.project_options = project_data;
          console.log(this.project_options);
          await this.kernelSpecSetPathRequest(newValue);
          return super.cd(newValue);
        }else{
          // this.project_options = project_data;
          let missing_tags = this.getProjectMissingTags(project_data as JSONObject);
          var available_tags = this.project_tags.filter((item) => !missing_tags.includes(item));
          let okButton = Dialog.okButton();
          await showErrorMessage("Project Error:",
          "The configuration file of the project (.swanproject) is currupted, missing fields are:"+available_tags+". \nThe project can not be opened, do you want to open a Dialog to edit it?",
          [Dialog.cancelButton(),
            okButton])
          console.log(okButton.accept);
          if(okButton.accept)
          {
            //TODO
          }
          return super.cd('.');  // we stay in the current directory to fix the project at the moment
        }  
      }else{
        return super.cd(newValue);
      }  
    }else{
      return super.cd(newValue);
    }
  }
  private project_options: ISwanProjectOptions = {name:'',stack:'',release:'',platform:'',user_script:'',readme:''};
  private project_tags:string[] = ['name','stack','release','platform','python2','python3','kernel_dirs'] 
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
