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

import logging
import datetime
import sys
import os

import flask

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = flask.Flask(__name__, subdomain_matching=True, template_folder="templates", static_folder="static")  # Default location for templates folder is just "templates" folder within the same folder as this file; for static, it is "static" folder
app.jinja_env.add_extension("jinja2.ext.do")  # Allows use of "do" command in jinja2 templates
#app.config["DEBUG"] = True
# To generate a random secret key do:
# import os; print(os.urandom(24).hex())
# You could also do "os.urandom(24)", but the output doesn't look as nice (it would look like b'\x08\xfb...')
# Source: https://stackoverflow.com/questions/34902378/where-do-i-get-a-secret-key-for-flask/34903502
app.config["SECRET_KEY"] = "af8de31c0df7e25fcfa29b8d5095ebaf8a1b4bf43745b578"
app.config["MONGODB_SETTINGS"] = {
    "host": "mongodb+srv://tester:S1AI23Pre8u5Pe8q@cluster0.eydtc.mongodb.net/test?retryWrites=true&w=majority",
    # 'db': 'project1',
    # 'host': '192.168.1.35',
    # 'port': 12345,
    # 'username': 'webapp',
    # 'password': 'pwd123',
}
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True  # to improve output of flask.jsonify(.)


@app.route("/")
@app.route("/home")
@app.route("/hello")
def hello():
    return f"Hi. sys.version={sys.version}</p>"


@app.route("/data/<string:name>")
def get_data(name):
    folder_path = "static"
    return flask.send_file(os.path.join(folder_path, name))


@app.route("/v004")
def layout():
    now = datetime.datetime.now()
    return flask.render_template("index.html",
                           datetime=now.strftime("%a, %b %-d %Y %X %z"),  # Reference: https://strftime.org/
                           #seed=seed,   #"/".join([lev0,lev1,lev2,lev3]) # doesn't work bc those are ints, not str
                           version=__version__,
                           #combined_img_contents_str=combined_img_contents_str,
                           )

"""Conventionally in python, __name__ is "__main__" if the module (aka python file) that is being run (aka this 
current file) is the main program. Otherwise, __name__ is "xyz.py" where xyz.py is the name of the main program (i.e. 
the original program being run). In other words, if __name__ is NOT "__main__" when the following code is reached, 
the current module (aka python file) is being imported into another program. Note- this is completely unrelated to 
whether the file name is "main.py"- these two uses of main are not linked. """

if __name__ == "__main__":
    """
    ## WAYS TO RUN THE APP ##
    (1) On Google App Engine. A webserver process such as Gunicorn will serve the app (see `entrypoint` in 
    the app.yaml). Run the ./scripts/deploy_gcloud.sh script.
    (2) Locally via google app engine simulation. Run the ./scripts/deploy_local.sh script.
    (3) Locally using Pycharm's special Flask functionality
    (4) Locally via python directly (either through Pycharm or not)
    The preferred method to run code locally is (3) as it is the fastest/easiest.
    Notably, only method (4) will access the app.run(.) code in the `if __name__ == "__main__":` block. The other ways 
    serve the app through a different way. Method (4) is useful  as I already found a way to make the app  isible 
    on the entire LAN and, through port fowarding, the internet.
    As of 2021_07_29, method (4) returns some Flask errors if you get past the home screen for some reason (not 
    important to look into now), while methods (1), (2), and (4) work.
    """

    # 127.0.0.1 = localhost
    # 0.0.0.0 = any interface (thus will be open to entire LAN, or even entire internet if port forward is enabled
    #app.run(host="127.0.0.1", port=5000, debug=True)
    app.run(host="0.0.0.0", port=5000, debug=False)