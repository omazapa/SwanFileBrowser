import {
    FileBrowserModel,
    FileBrowser
  } from '@jupyterlab/filebrowser';
import { request } from "./request";

export class SwanFileBrowserModel extends FileBrowserModel
{
  constructor(options: FileBrowserModel.IOptions) {
    super(options)
  }

  protected projectInfoRequest(path:string):any
  {
    try {
      return request<any>('swan/project/info?path='+path, {
        method: 'GET'
      }).then(rvalue => {
          return rvalue;
      });
    } catch (reason) {
      console.error(
        `Error on POST 'swan/project/info/'+ ${path}.\n${reason}`
      );
    }
  }

  async cd(newValue = '.'): Promise<void> {
    if(newValue!=='.')
    {
        this.projectInfoRequest(newValue);
        this.manager.services.kernelspecs.refreshSpecs();
    }
    super.cd(newValue);
  }
}


export class SwanFileBrowser extends FileBrowser{
  constructor(options: FileBrowser.IOptions) {
    super(options);
    super.id = options.id;    

  }
}
