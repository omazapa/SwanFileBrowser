// Copyright (c) SWAN Development Team.
// Author: Omar.Zapata@cern.ch 2021
import { FilterFileBrowserModel, FileBrowser } from '@jupyterlab/filebrowser';
import { request } from './request';
import { validateSpecModels } from './kernelspec/validate';
import { SwanDirListing } from './listing';

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
  async cd(newValue: string): Promise<void> {
    return super.cd(newValue).then(async () => {
      if (this.path === 'SWAN_projects') {
        // return request<any>('/api/contents/'+this.path, {
        //   method: 'GET'
        // })
        //   .then(contents => {
        //     console.log(contents);
        //   });
      }
      await this.kernelSpecSetPathRequest(this.path);
    });
  }
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
