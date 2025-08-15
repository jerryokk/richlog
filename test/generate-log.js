/**
 * RichLog 测试生成器
 * 生成包含 RICHLOG 格式数据的示例日志文件
 */

const fs = require('fs');
const path = require('path');
const { RichLogEncoder } = require('../src/core');

// 生成示例配置数据
function generateConfigExample() {
  const config = {
    server: {
      port: 8080,
      host: "localhost",
      timeout: 30000,
      debug: true
    },
    database: {
      host: "db.example.com",
      port: 5432,
      username: "admin",
      password: "********",
      database: "app_db",
      poolSize: 10,
      connectionTimeout: 5000
    },
    logging: {
      level: "info",
      file: "/var/log/app.log",
      rotation: {
        maxSize: "10MB",
        maxFiles: 5,
        compress: true
      }
    },
    features: {
      enableCache: true,
      enableNotifications: true,
      cacheTime: 3600,
      maxUploadSize: 52428800
    }
  };
  
  return RichLogEncoder.encodeConfig(config);
}

// 生成示例图片数据
function generateImageExample() {
  // 创建一个简单的纯色图片
  const width = 200;
  const height = 100;
  
  // 创建 BMP 文件头
  const fileSize = 54 + width * height * 3;
  const header = Buffer.alloc(54);
  
  // BMP 文件头
  header.write('BM', 0);                     // 魔数
  header.writeUInt32LE(fileSize, 2);         // 文件大小
  header.writeUInt32LE(0, 6);                // 保留
  header.writeUInt32LE(54, 10);              // 像素数据偏移
  
  // DIB 头
  header.writeUInt32LE(40, 14);              // DIB 头大小
  header.writeInt32LE(width, 18);            // 宽度
  header.writeInt32LE(height, 22);           // 高度
  header.writeUInt16LE(1, 26);               // 颜色平面数
  header.writeUInt16LE(24, 28);              // 每像素位数
  header.writeUInt32LE(0, 30);               // 压缩方法
  header.writeUInt32LE(width * height * 3, 34); // 图像大小
  header.writeInt32LE(2835, 38);             // 水平分辨率
  header.writeInt32LE(2835, 42);             // 垂直分辨率
  header.writeUInt32LE(0, 46);               // 调色板颜色数
  header.writeUInt32LE(0, 50);               // 重要颜色数
  
  // 像素数据
  const pixelData = Buffer.alloc(width * height * 3);
  
  // 创建渐变色
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 3;
      // 蓝色渐变
      pixelData[pos] = Math.round(255 * x / width);
      // 绿色渐变
      pixelData[pos + 1] = Math.round(255 * y / height);
      // 红色固定
      pixelData[pos + 2] = 128;
    }
  }
  
  // 组合头部和像素数据
  const bmpData = Buffer.concat([header, pixelData]);
  
  return RichLogEncoder.encodeImage(bmpData);
}

// 生成示例命令输出
function generateCommandExample() {
  const commandOutput = `$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            3.9G     0  3.9G   0% /dev
tmpfs           796M  1.7M  794M   1% /run
/dev/nvme0n1p2  457G  199G  235G  46% /
tmpfs           3.9G  132M  3.8G   4% /dev/shm
tmpfs           5.0M  4.0K  5.0M   1% /run/lock
tmpfs           3.9G     0  3.9G   0% /sys/fs/cgroup
/dev/nvme0n1p1  511M  5.3M  506M   2% /boot/efi
tmpfs           796M   80K  796M   1% /run/user/1000

$ ps aux | grep node
user       1234  0.6  1.2 1156376 102032 ?      Ssl  08:30   1:23 node /usr/local/bin/npm start
user       5678  0.0  0.0   9032   736 pts/0    S+   10:45   0:00 grep --color=auto node

$ netstat -tuln
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
tcp6       0      0 :::22                   :::*                    LISTEN     
udp        0      0 0.0.0.0:68              0.0.0.0:*                          
udp        0      0 0.0.0.0:5353            0.0.0.0:*                          

$ uptime
 10:46:03 up 2 days,  2:15,  3 users,  load average: 0.52, 0.58, 0.59
`;

  return RichLogEncoder.encodeCommand(commandOutput);
}

// 生成示例日志文件
function generateLogFile() {
  // 为RICHLOG行添加时间戳前缀的辅助函数
  function addTimestampToRichLogLines(richlogLines, baseTimestamp) {
    return richlogLines.map((line, index) => {
      if (line.startsWith("RICHLOG:")) {
        // 为每个RICHLOG行添加递增的时间戳（毫秒递增）
        const timestamp = new Date(baseTimestamp.getTime() + index).toISOString()
          .replace('T', ' ').slice(0, 23).replace('Z', '');
        return `[${timestamp}] ${line}`;
      }
      return line;
    });
  }

  const configRichLogLines = addTimestampToRichLogLines(
    generateConfigExample(), 
    new Date('2023-08-15T10:00:01.236Z')
  );
  
  const imageRichLogLines = addTimestampToRichLogLines(
    generateImageExample(), 
    new Date('2023-08-15T10:15:30.533Z')
  );
  
  const commandRichLogLines = addTimestampToRichLogLines(
    generateCommandExample(), 
    new Date('2023-08-15T11:00:00.755Z')
  );

  const logLines = [
    "[2023-08-15 10:00:01.235] 程序启动",
    ...configRichLogLines,
    "[2023-08-15 10:00:02.105] 配置加载完成",
    "[2023-08-15 10:15:30.532] 检测到异常",
    ...imageRichLogLines,
    "[2023-08-15 10:15:31.023] 异常已记录",
    "[2023-08-15 11:00:00.754] 执行磁盘空间检查",
    ...commandRichLogLines,
    "[2023-08-15 11:00:01.125] 检查完成"
  ];
  
  // 写入日志文件
  fs.writeFileSync(
    path.join(__dirname, 'sample.log'), 
    logLines.join('\n'), 
    'utf8'
  );
  
  console.log('生成的日志文件:');
  console.log('- sample.log');
}

// 运行生成器
generateLogFile();