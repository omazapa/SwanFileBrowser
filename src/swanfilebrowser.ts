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

  // protected projectInfoRequest(path:string):any
  // {
  //   try {
  //     return request<any>('swan/project/info?path='+path, {
  //       method: 'POST'
  //     }).then(rvalue => {
  //         return rvalue;
  //     });
  //   } catch (reason) {
  //     console.error(
  //       `Error on POST 'swan/project/info?path='+ ${path}.\n${reason}`
  //     );
  //   }
  // }
  protected projectInfoRequest(project:string):any
  {
    const dataToSend = {'path':project};
    try {
      return request<any>('swan/project/info', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      }).then(rvalue => {
        this.manager.services.kernelspecs.refreshSpecs();
        return rvalue;
      });
    } catch (reason) {
      console.error(
        `Error on POST 'swan/project/info'+ ${dataToSend}.\n${reason}`
      );
    }
  }
  async cd(newValue = '.'): Promise<void> {
    if(newValue!=='.')
    {
        this.projectInfoRequest(newValue);
        //this.manager.services.kernelspecs.refreshSpecs();
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
