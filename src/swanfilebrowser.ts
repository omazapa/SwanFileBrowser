// Copyright (c) SWAN Development Team.
// Author: Omar.Zapata@cern.ch 2021
import { FilterFileBrowserModel, FileBrowser } from '@jupyterlab/filebrowser';
import { request } from './request';
import { validateSpecModels } from './kernelspec/validate';

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
        console.log(rvalue);
        await request<any>('/api/kernelspecs', {
          method: 'GET'
        })
          .then(specs => {
            console.log('retques');
            console.log(specs);
            //https://stackoverflow.com/questions/46634876/how-can-i-change-a-readonly-property-in-typescript
            //I need to reset this to null if it is not a project
            //supported by all browsers
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
            // why all this?
            // calling this.manager.services.kernelspecs.refreshSpecs()  was not working when I am outside the project folder
            // it was taking the previuos set of kernels and I need to reset it to null.
            if (rvalue.is_project) {
              Object.defineProperty(
                this.manager.services.kernelspecs,
                'specs',
                {
                  value: validateSpecModels(specs),
                  configurable: true
                }
              );
            } else {
              Object.defineProperty(
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
            console.log('catch');
            console.log(err);
          });
        return rvalue;
      });
    } catch (reason) {
      console.error(
        `Error on POST 'swan/kernelspec/set'+ ${dataToSend}.\n${reason}`
      );
    }
  }
  async cd(newValue: string): Promise<void> {
    return super.cd(newValue).then(async () => {
      await this.kernelSpecSetPathRequest(this.path).then(() => {
        // this.manager.services.kernelspecs.refreshSpecs();
      });
      console.log('on cd: this.manager.services.kernelspecs.specs');
      console.log(this.manager.services.kernelspecs.specs);
    });
  }
}

export class SwanFileBrowser extends FileBrowser {
  constructor(options: FileBrowser.IOptions) {
    super(options);
    super.id = options.id;
  }
}
