#!/bin/sh
#
# To change the permissions of this file so it can be run in terminal, do
# chmod 755 <filename>.sh
# chmod 755 src/scripts/save_email_images.sh
# to run
# ./src/scripts/save_email_images.sh
#
# This file allows you to include email address in a GitHub repo, publically
# available to everyone, while still preventing it from easily being accessed
# by web scrapers for spam email.

# SAVETOFILEPATH can be passed in; otherwise, default value will be used
# https://linuxhandbook.com/bash-arguments/
SAVETOFILEPATH=${1:-"docs/email-address-image.png"}

IMAGETEXT="Rahul Sai Yerrabelli: \n  - ryerrab1@alumni.jh.edu \n  - rsy2@illinois.edu"

echo "Saving email address(es) as an image. May take a few seconds."

echo $IMAGETEXT | convert -background none -density 400 -resample 150 -unsharp 0x.5 -font "arial" text:- -trim +repage -bordercolor white -border 0 $SAVETOFILEPATH

echo "Finished. Saved to file '$SAVETOFILEPATH'. On mac, to view the file with:"
echo "  open $SAVETOFILEPATH -a Preview"

ls -l $SAVETOFILEPATH
