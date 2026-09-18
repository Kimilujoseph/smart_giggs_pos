const fs = require('fs');
const path = 'src/services/sales-services.js';
let content = fs.readFileSync(path, 'utf8');

// Find the block by unique anchors and replace surgically
const oldKeyLine = "        const analyticsKey = `${today.toISOString()}-${CategoryId}-${shop.id\r\n          }-${sellerId}-${financeStatusKey}-${financeIdKey}`;";
const newKeyLine = "        // isConsignment lives on the mobiles table (productDetails).\r\n        // Accessories are always non-consignment so default to false.\r\n        const isConsignment =\r\n          itemType === \"mobiles\" ? (productDetails.isConsignment ?? false) : false;\r\n\r\n        const analyticsKey = `${today.toISOString()}-${CategoryId}-${shop.id\r\n          }-${sellerId}-${financeStatusKey}-${financeIdKey}-${isConsignment}`;";

const oldDataBlock = "          financeId: parsedFinanceId,\r\n          totalUnitsSold: 0,";
const newDataBlock = "          financeId: parsedFinanceId,\r\n          isConsignment,\r\n          totalUnitsSold: 0,";

let changed = false;

if (content.includes(oldKeyLine)) {
  content = content.replace(oldKeyLine, newKeyLine);
  changed = true;
  console.log('Replaced analyticsKey line.');
} else {
  console.error('ERROR: analyticsKey old line not found');
  process.exit(1);
}

if (content.includes(oldDataBlock)) {
  content = content.replace(oldDataBlock, newDataBlock);
  console.log('Replaced data block line.');
} else {
  console.error('ERROR: data block old line not found');
  process.exit(1);
}

fs.writeFileSync(path, content, 'utf8');
console.log('SUCCESS - file patched.');
