/**
 *
 * @param {string} str
 * @returns {number[]}
 */
function stringToCharCodeArray(str) {
  return str.split("").map((item) => item.charCodeAt(0));
}

/**
 *
 * @param {any[]} array
 * @param {any} newItem
 * @param {(a,b)=>number} compare
 * @returns {void}
 */
function insertNewItemAndKeepArraySorted(array, newItem, compare) {
  if (array.length === 0) {
    array.push(newItem);
    return;
  }
  if (compare(array[0], newItem) >= 0) {
    array.unshift(newItem);
    return;
  }
  if (compare(array[array.length - 1], newItem) <= 0) {
    array.push(newItem);
    return;
  }

  let left = 0,
    right = array.length - 1,
    mid = -1;
  while (left < right) {
    mid = Math.floor((left + right) / 2);
    if (compare(array[mid], newItem) < 0) {
      left = mid + 1;
      if (compare(array[left], newItem) >= 0) {
        right = left;
      } else {
        left += 1;
      }
    } else if (compare(array[mid], newItem) >= 0) {
      right = mid;
      if (compare(array[mid - 1], newItem) <= 0) {
        left = right;
      } else {
        right -= 1;
      }
    } else {
      left = right;
    }
  }
  array.splice(left, 0, newItem);
}

/**
 * @param {IterableIterator<any>} array
 * @returns {Map<[any,number]>}
 */
function getFrequencyMapFromIterableIterator(array) {
  const result = new Map();
  for (let value of array) {
    if (result.has(value)) {
      result.set(value, result.get(value) + 1);
    } else {
      result.set(value, 1);
    }
  }
  return result;
}

/**
 *
 * @param  {Map<number,number>[]} maps
 * @returns {Map<number,number>}
 */
function unionMaps(...maps) {
  const result = new Map();
  maps.forEach((map) => {
    for (let [key, value] of map.entries()) {
      const prevValue = result.get(key);
      if (prevValue) {
        result.set(key, prevValue + value);
      } else {
        result.set(key, value);
      }
    }
  });

  return result;
}

/**
 * str.length%8 need to be equal to 0 otherwise an error will be throwed
 * str can only consist of 0 or 1 otherwise an error will be throwed
 * @param {string} str
 * @returns {Buffer}
 */
function encodingStringToBuffer(str) {
  if (str.length % 8 !== 0) {
    throw new Error("invalid string length");
  }
  if (/[^01]/.test(str)) {
    throw new Error("invalid value in string,only allow '0' and '1'");
  }
  const arrayLength = str.length / 8;
  const uInt8Array = new Uint8Array(arrayLength);
  for (let i = 0; i < str.length; i += 8) {
    uInt8Array[i] = Number.parseInt(str.slice(i, i + 8));
  }

  return Buffer.from(uInt8Array);
}

/**
 * @param {string} str
 * @returns {[number,string]} [count,str]
 */
function addZeroEndOfStringLetLengthDividedBy8(str) {
  if (str.length % 8 === 0) {
    return [0, str];
  }
  let count = 0;
  while (str.length % 8 !== 0) {
    str += "0";
    count += 1;
  }
  return [count, str];
}

/**
 *
 * @param {Map} map
 * @returns {string}
 */
function parseMapToJSON(map) {
  if (map instanceof Map === false) {
    throw new Error("map should instance of Map");
  }
  const result = {};
  for (const [key, value] of map.entries()) {
    result[key] = value;
  }
  return JSON.stringify(result);
}

module.exports = {
  stringToCharCodeArray,
  insertNewItemAndKeepArraySorted,
  getFrequencyMapFromIterableIterator,
  unionMaps,
  encodingStringToBuffer,
  addZeroEndOfStringLetLengthDividedBy8,
  parseMapToJSON,
};
