#pip3 install jupyterlab_swan --user

#pip3 install  . --user
# Register server extension
#jupyter serverextension enable --py jupyterlab_swan
#jupyter serverextension enable --py jupyterlab_swan
# Install dependencies
jupyter labextension disable @jupyterlab/filebrowser-extension
#jupyter labextension enable @jupyterlab/filebrowser-extension
jlpm clean
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
cd ~
#jupyter lab --watch 
jupyter lab
cd -
