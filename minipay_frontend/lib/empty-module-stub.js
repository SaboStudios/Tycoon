/**
 * Stub for optional wallet SDK peers MiniPay never uses
 * (Base Account, MetaMask Connect, Tempo accounts, x402, etc.).
 * Satisfies webpack resolve during `next build` on Vercel.
 */
const handler = {
  get(_t, prop) {
    if (prop === "__esModule") return true;
    if (prop === "then") return undefined;
    if (prop === "default") return new Proxy({}, handler);
    return (..._args) => new Proxy({}, handler);
  },
};
module.exports = new Proxy({}, handler);
