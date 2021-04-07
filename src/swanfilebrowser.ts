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

  protected projectInfoRequest(project:string):any
  {
    const dataToSend = {'path':project,'caller':'swanfilebrowser'};
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
    return super.cd(newValue).then(()=>{
      if(newValue!=='.')
      {
        this.projectInfoRequest(this.path); 
      }
    })
  }
}


export class SwanFileBrowser extends FileBrowser{
  constructor(options: FileBrowser.IOptions) {
    super(options);
    super.id = options.id;    

  }
}
