#!/bin/sh

SAVETOFILENAME=email-address-image.png

echo Saving email addresses as an image. May take a second.

echo "Rahul Yerrabelli: \n  ryerrab1@alumni.jh.edu \n  rsy2@illinois.edu \n\nAlexander Spector: \n  aspector@jhu.edu" | convert -background none -density 400 -resample 150 -unsharp 0x.5 -font "arial" text:- -trim +repage -bordercolor white -border 0 $SAVETOFILENAME

echo Done. Saved to file name $SAVETOFILENAME.
