To implement the kernel spec manager modifications when I am inside or outside of a folder that is a
project, I took the routines on this folder from https://github.com/jupyterlab/jupyterlab/blob/master/packages/services/src/
and I did slight modifications for our needs.
This allows to disable kernels when I am outside of the project.