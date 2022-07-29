"""
# Rahul Yerrabelli
# Can run with "setup.py install"
#
# Module setup file
# Originally created following this tutorial on versioning levels:
# https://jacobtomlinson.dev/posts/2020/creating-an-open-source-python-project-from-scratch/
# https://jacobtomlinson.dev/posts/2020/versioning-and-formatting-your-python-code/
"""

import setuptools

import ryerrabelli as rsy

module_name = "TonometrySimulation"
module_data = rsy.get_module_data(module_name=module_name)  #, path=os.path.realpath(os.curdir)
# Operator "**" unpacks dict into named arguments i.e. setup(name=x,version=y, cmdclass=z,...)

setuptools.setup(**module_data)
