/**
 * RichLog 解析器
 * 解析日志中的 RICHLOG 格式数据并重组
 */

class RichLogParser {
  constructor() {
    // 存储已识别但未完成的数据片段
    this.fragments = {};
    // 存储已完成重组的数据项
    this.completedItems = {};
    // 正则表达式用于匹配 RICHLOG 格式
    this.richlogRegex = /RICHLOG:([^,]+),([^,]+),(\d+),(\d+),([0-9a-fA-F]+)/;
  }

  /**
   * 解析单行日志
   * @param {string} logLine - 日志行文本
   * @returns {object|null} - 如果是 RICHLOG 则返回解析结果，否则返回 null
   */
  parseLine(logLine) {
    const match = this.richlogRegex.exec(logLine);
    if (!match) return null;
    
    const [_, type, uuid, index, totalChunks, hexData] = match;
    const indexNum = parseInt(index, 10);
    const totalNum = parseInt(totalChunks, 10);
    
    // 创建解析结果对象
    return {
      type,
      uuid,
      index: indexNum,
      totalChunks: totalNum,
      hexData
    };
  }

  /**
   * 添加日志行并尝试重组
   * @param {string} logLine - 日志行文本
   * @returns {object|null} - 如果某个 uuid 的全部片段都已收集并重组，返回完整数据，否则返回 null
   */
  addLogLine(logLine) {
    const parsedData = this.parseLine(logLine);
    if (!parsedData) return null;
    
    const { type, uuid, index, totalChunks, hexData } = parsedData;
    
    // 初始化该 UUID 的片段存储
    if (!this.fragments[uuid]) {
      this.fragments[uuid] = {
        type,
        totalChunks,
        chunks: {},
        receivedChunks: 0
      };
    }
    
    // 存储片段数据
    const fragmentData = this.fragments[uuid];
    
    // 检查数据类型是否匹配
    if (fragmentData.type !== type) {
      console.warn(`UUID ${uuid} 的数据类型不一致: ${fragmentData.type} vs ${type}`);
      return null;
    }
    
    // 检查总片段数是否匹配
    if (fragmentData.totalChunks !== totalChunks) {
      console.warn(`UUID ${uuid} 的总片段数不一致: ${fragmentData.totalChunks} vs ${totalChunks}`);
      return null;
    }
    
    // 如果该片段尚未添加，则添加并增加计数
    if (!fragmentData.chunks[index]) {
      fragmentData.chunks[index] = hexData;
      fragmentData.receivedChunks++;
    }
    
    // 检查是否已收集所有片段
    if (fragmentData.receivedChunks === totalChunks) {
      // 重组数据
      const completeData = this.assembleData(uuid);
      if (completeData) {
        // 将完成的数据存入已完成项
        this.completedItems[uuid] = completeData;
        // 清除片段数据，释放内存
        delete this.fragments[uuid];
        return completeData;
      }
    }
    
    return null;
  }

  /**
   * 重组特定 UUID 的全部片段
   * @param {string} uuid - 数据 UUID
   * @returns {object|null} - 重组后的完整数据，如果无法重组则返回 null
   */
  assembleData(uuid) {
    const fragmentData = this.fragments[uuid];
    if (!fragmentData) return null;
    
    // 检查是否已收集所有片段
    if (fragmentData.receivedChunks !== fragmentData.totalChunks) {
      return null;
    }
    
    // 按索引顺序连接十六进制数据
    let combinedHexData = '';
    for (let i = 1; i <= fragmentData.totalChunks; i++) {
      if (!fragmentData.chunks[i]) {
        console.error(`UUID ${uuid} 缺失片段 ${i}`);
        return null;
      }
      combinedHexData += fragmentData.chunks[i];
    }
    
    // 返回完整的数据对象
    return {
      type: fragmentData.type,
      uuid,
      hexData: combinedHexData
    };
  }
  
  /**
   * 获取特定 UUID 的完整数据
   * @param {string} uuid - 数据 UUID
   * @returns {object|null} - 重组后的完整数据，如果尚未完成则返回 null
   */
  getCompletedItem(uuid) {
    return this.completedItems[uuid] || null;
  }
  
  /**
   * 获取所有已完成重组的数据项
   * @returns {object} - 以 UUID 为键的完整数据对象
   */
  getAllCompletedItems() {
    return this.completedItems;
  }
  
  /**
   * 获取指定类型的所有已完成数据项
   * @param {string} type - 数据类型
   * @returns {Array} - 指定类型的完整数据对象数组
   */
  getCompletedItemsByType(type) {
    return Object.values(this.completedItems)
      .filter(item => item.type === type);
  }
  
  /**
   * 将十六进制字符串转换为原始数据
   * @param {string} hexString - 十六进制字符串
   * @returns {string} - 解码后的字符串
   */
  hexToString(hexString) {
    let result = '';
    for (let i = 0; i < hexString.length; i += 2) {
      result += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
  }
  
  /**
   * 将十六进制字符串转换为原始二进制数据的 Base64 表示
   * @param {string} hexString - 十六进制字符串
   * @returns {string} - Base64 编码的字符串
   */
  hexToBase64(hexString) {
    // 创建一个字节数组
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i/2] = parseInt(hexString.substr(i, 2), 16);
    }
    
    // 将字节数组转换为 Base64
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

module.exports = RichLogParser;