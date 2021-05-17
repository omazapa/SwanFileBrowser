// Copyright (c) SWAN Development Team.
// Author: Omar.Zapata@cern.ch 2021
import {
  FilterFileBrowserModel,
    FileBrowser
  } from '@jupyterlab/filebrowser';
import { request } from "./request";

export class SwanFileBrowserModel extends FilterFileBrowserModel
{
  constructor(options: FilterFileBrowserModel.IOptions) {
    super(options)
    this.kernelSpecSetPathRequest(this.path);

  }

  protected kernelSpecSetPathRequest(path:string):any
  {
    const dataToSend = {'path':path,'caller':'swanfilebrowser'};
    try {
      return request<any>('/swan/kernelspec/set', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      }).then(rvalue => {
        this.manager.services.kernelspecs.refreshSpecs();
        return rvalue;
      });
    } catch (reason) {
      console.error(
        `Error on POST 'swan/kernelspec/set'+ ${dataToSend}.\n${reason}`
      );
    }
  }
  async cd(newValue = '.'): Promise<void> {
    return super.cd(newValue).then(async ()=>{
        await this.kernelSpecSetPathRequest(this.path); 
    })
  }
}


export class SwanFileBrowser extends FileBrowser{
  constructor(options: FileBrowser.IOptions) {
    super(options);
    super.id = options.id;    

  }
}
