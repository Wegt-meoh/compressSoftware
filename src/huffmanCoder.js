const {
  unionMaps,
  stringToCharCodeArray,
  getFrequencyMapFromIterableIterator,
  insertNewItemAndKeepArraySorted,
} = require("./utils");

class HuffmanTreeNode {
  constructor(value, frequency, left = null, right = null) {
    this.value = value;
    this.frequency = frequency;
    this.left = left;
    this.right = right;
  }
}

class HuffmanCoder {
  #frequencyMap = new Map();

  /**
   *
   * @param {Buffer} slice
   */
  process(slice) {
    const frequencyMap = getFrequencyMapFromIterableIterator(slice);
    this.#frequencyMap = unionMaps(this.#frequencyMap, frequencyMap);
  }

  union(...maps) {
    this.#frequencyMap = unionMaps(this.#frequencyMap, ...maps);
  }

  clear() {
    this.#frequencyMap.clear();
  }

  #generateTree() {
    const array = Array.from(this.#frequencyMap).sort((a, b) => a[1] - b[1]);
    const treeNodeList = array.map(
      (item) => new HuffmanTreeNode(item[0], item[1], null, null)
    );

    while (treeNodeList.length > 1) {
      const node1 = treeNodeList.shift();
      const node2 = treeNodeList.shift();
      const newNode = new HuffmanTreeNode(
        null,
        node1.frequency + node2.frequency,
        node1,
        node2
      );
      insertNewItemAndKeepArraySorted(
        treeNodeList,
        newNode,
        (a, b) => a.frequency - b.frequency
      );
    }
    return treeNodeList[0];
  }

  /**
   *
   * @returns {Map<string,string>}
   */
  generateEncodeTable() {
    const root = this.#generateTree();
    const encodingTable = new Map();
    const dfs = (root, note) => {
      if (root === null) return;
      if (root.left === null && root.right === null) {
        encodingTable.set(root.value, note);
        return;
      }

      dfs(root.left, note + "0");
      dfs(root.right, note + "1");
    };
    dfs(root, "");
    return encodingTable;
  }
}

module.exports = {
  HuffmanCoder,
  HuffmanTreeNode,
};
