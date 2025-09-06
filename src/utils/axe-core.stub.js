// Minimal stub for 'axe-core' to prevent bundling the real library in production
// when VITE_ENABLE_A11Y_DEV is not set to true.

const axeStub = {
  async run() {
    return { violations: [], passes: [], incomplete: [], inapplicable: [] };
  },
};

export default axeStub;

