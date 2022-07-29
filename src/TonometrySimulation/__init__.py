# Background below from https://careerkarma.com/blog/what-is-init-py/
# What is __init__.py? The __init__.py file lets
# the Python interpreter know that a directory contains code for a Python module. An __init__.py file can be blank.
# Without one, you cannot import modules from another folder into your project.
#
# The role of the __init__.py file is similar to the __init__ function in a Python class. The file essentially the
# constructor of your package or directory without it being called such. It sets up how packages or functions will be
# imported into your other files.
#
# In its simplest case, the __init__.py file is an empty file. However, it is also used to set up imports,
# so they can be accessed elsewhere.

# An empty file "__init__.py" is still useful!


from ._version import get_versions
__version__ = get_versions()['version']
del get_versions
from ._version import get_versions
__version__ = get_versions()['version']
del get_versions
