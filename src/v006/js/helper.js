export function isNullOrUndef(myVar) {
  return myVar === null || myVar === undefined;
}

export function areArraysEqual(firstArr, seconArr) {
  if (firstArr === seconArr) return true;  // <- what happens if both are false or many other same non-array values
  if (isNullOrUndef(firstArr) || isNullOrUndef(seconArr)) return false;
  if (firstArr.length !== seconArr.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < firstArr.length; ++i) {
    if (firstArr[i] !== seconArr[i]) return false;
  }
  return true;
}
