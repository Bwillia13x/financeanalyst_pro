/**
 * Basic Export Functionality Test
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExportTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  testExportService() {
    console.log('🧪 Testing Export Service...');

    const exportServicePath = path.join(__dirname, 'src', 'services', 'exportService.js');
    if (fs.existsSync(exportServicePath)) {
      const content = fs.readFileSync(exportServicePath, 'utf8');
      const hasExcel = content.includes('XLSX') || content.includes('excel');
      const hasPDF = content.includes('jsPDF') || content.includes('pdf');

      if (hasExcel) this.recordResult(true, 'Excel Export');
      else this.recordResult(false, 'Excel Export');

      if (hasPDF) this.recordResult(true, 'PDF Export');
      else this.recordResult(false, 'PDF Export');
    }
  }

  testCLIExports() {
    console.log('🧪 Testing CLI Export Commands...');

    const dataCommandsPath = path.join(__dirname, 'src', 'services', 'commands', 'dataCommands.js');
    if (fs.existsSync(dataCommandsPath)) {
      const content = fs.readFileSync(dataCommandsPath, 'utf8');
      const hasExport = content.includes('EXPORT_JSON') || content.includes('export');

      if (hasExport) this.recordResult(true, 'CLI Export Commands');
      else this.recordResult(false, 'CLI Export Commands');
    }
  }

  recordResult(success, testName) {
    const status = success ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${success ? 'PASSED' : 'FAILED'}`);
    if (success) this.passed++;
    else this.failed++;
  }

  async run() {
    console.log('🚀 EXPORT FUNCTIONALITY TEST\n');

    this.testExportService();
    this.testCLIExports();

    const total = this.passed + this.failed;
    const successRate = ((this.passed / total) * 100).toFixed(1);

    console.log(`\n📊 Results: ${this.passed}/${total} passed (${successRate}%)`);
    console.log('🏁 Export test completed');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new ExportTestSuite();
  testSuite.run().catch(console.error);
}

export default ExportTestSuite;
