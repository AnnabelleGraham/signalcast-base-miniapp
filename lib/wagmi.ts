import { Attribution } from "ox/erc8021";
import { createConfig, http, injected } from "wagmi";
import { base } from "wagmi/chains";

export const BUILDER_CODE = "bc_wnwpxvhj";

export const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected()],
  transports: { [base.id]: http() },
  dataSuffix: DATA_SUFFIX,
});
