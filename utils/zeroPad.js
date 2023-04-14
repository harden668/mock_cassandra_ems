function zeroPad(num, digit) {
  let numStr = num.toString(); // 将数字转换为字符串
  let numDigits = numStr.length; // 获取数字的位数

  if (numDigits < digit) { // 如果数字小于指定位数，就在前面补零
    numStr = numStr.padStart(digit, '0');
  }
  console.log(numStr);
  return numStr; // 返回补零后的字符串
}

module.exports = zeroPad;