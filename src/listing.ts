// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Message } from '@lumino/messaging';

import {
  ITranslator
} from '@jupyterlab/translation';

import { swanProjectIcon } from './icons';
import { DOMUtils} from '@jupyterlab/apputils';

import { DirListing } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';

export interface SWANIModel{
  content: Object | null, 
  created: string, 
  format: string | null, 
  is_project: boolean,
  last_modified: string,
  mimetype: string|null,
  name: string,
  path: string,
  size: number,
  type: string,
  writable: boolean
};
export interface SWANIFileType
{
  contentType: any,
  displayName: string,
  extensions: any,
  fileFormat: any,
  icon: any, 
  mimeTypes: any,
  name: string  
}

export class SwanRenderer extends DirListing.Renderer {
  constructor() {
    super();
  }
  updateItemNode(
    node: HTMLElement,
    model: Contents.IModel,
    fileType?: DocumentRegistry.IFileType,
    translator?: ITranslator,
    isProject?:boolean

  ): void {
    super.updateItemNode(node,model,fileType,translator)
    if(isProject)
    {
      const iconContainer = DOMUtils.findElement(
        node,
        'jp-DirListing-itemIcon'
      );

      swanProjectIcon.element({
        container: iconContainer,
        className: 'jp-DirListing-itemIcon',
        stylesheet: 'listing'
      });
      iconContainer.setAttribute(
          'isproject',
          'true'
        );
        console.log(iconContainer);
    }
  }
}


/**
 * A widget which hosts a file list area.
 */
export class SwanDirListing extends DirListing {
  /**
   * Construct a new file browser directory listing widget.
   *
   * @param model - The file browser view model.
   */
  constructor(options: DirListing.IOptions) {
    // super({...options,renderer: new SwanRenderer()});
    super({...options,renderer: new SwanRenderer()});
  }
  /**
   * A handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    // @ts-ignore
    const items = this._sortedItems;
    // @ts-ignore
    const nodes = this._items;
    // @ts-ignore
    const renderer = this._renderer;

    // @ts-ignore
    items.forEach((item, i) => {
      const node = nodes[i];
      // @ts-ignore
      const ft = this._manager.registry.getFileTypeForModel(item);
      const swan_item = item as SWANIModel;
      let is_project = false;
      if(this.model.path === 'SWAN_projects' && swan_item.is_project === true )
      {
        is_project=true;
      }
     renderer.updateItemNode(
          node,
          item,
          ft,
          this.translator,
          is_project); 
    });

  }
}

