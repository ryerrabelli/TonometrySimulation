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

export function numberDictToStr(dict1, fractionDigits=1) {
  if (dict1 instanceof Array) {
    const arr = []
    for (let ind = 0; ind < dict1.length; ind++) {
      if (typeof dict1[ind]==="number" || dict1[ind] instanceof Number) { // instanceof won't work for primitive types
        arr.push(dict1[ind].toFixed(fractionDigits));
      } else arr.push(dict1[ind]);
    }
    return arr;
  } else if (dict1 instanceof Object) {  // don't check for typeof dict===object bc dict=null will return true
    const dict2 = {}
    for (const key in dict1) {
      if (typeof dict1[key]==="number" || dict1[key] instanceof Number) { // instanceof won't work for primitive types
        dict2[key] = dict1[key].toFixed(fractionDigits);
      } else dict2[key] = dict1[key];
    }
    return dict2;
  } else return dict1;

}