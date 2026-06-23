const PayOSModule = require('@payos/node');
const PayOS = PayOSModule.PayOS || PayOSModule.default || PayOSModule;

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'e6ca9a9a-4cf9-4b4c-a9bb-0e9e5d3197ad',
  apiKey: process.env.PAYOS_API_KEY || '5a2bc43b-f0ee-4828-8014-0c6fbf751584',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '3a13460d1d246d27d0d31a4df06d993f12f87a3cfed1a1b3285be0edacf467ce'
});

function cleanDescription(str) {
  if (!str) return 'Thanh toan goi hoc';
  
  // Loại bỏ dấu tiếng Việt
  const signedChars = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";
  const unsignedChars = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD";
  
  let result = str;
  for (let i = 0; i < signedChars.length; i++) {
    const reg = new RegExp(signedChars[i], "g");
    result = result.replace(reg, unsignedChars[i]);
  }
  
  // Chỉ giữ lại chữ, số và khoảng trắng
  result = result.replace(/[^a-zA-Z0-9 ]/g, '');
  
  // Rút gọn còn tối đa 25 ký tự
  return result.trim().substring(0, 25);
}

async function createPaymentLink(orderCode, amount, description, returnUrl, cancelUrl) {
  try {
    const cleanedDesc = cleanDescription(description);
    const paymentData = {
      orderCode: Number(orderCode),
      amount: Number(amount),
      description: cleanedDesc,
      cancelUrl: cancelUrl || 'https://google.com',
      returnUrl: returnUrl || 'https://google.com'
    };

    console.log('[PayOS] Đang tạo link thanh toán:', paymentData);
    const paymentLinkRes = await payOS.paymentRequests.create(paymentData);
    return paymentLinkRes;
  } catch (error) {
    console.error('[PayOS] Lỗi khi tạo link thanh toán:', error);
    throw error;
  }
}

module.exports = {
  payOS,
  cleanDescription,
  createPaymentLink
};
