import { parseAbi } from "viem";

export const SIGNALCAST_ADDRESS = "0xc486f1ec06ba4b14051a60f11018b8ba2a3fff79" as const;

export const signalCastAbi = parseAbi([
  "function signalId() view returns (uint256)",
  "function signals(uint256 id) view returns (address creator, uint96 stakeAmount, uint32 endTime, uint32 upCount, uint32 downCount, bool resolved, bool outcome)",
  "function participated(uint256 id, address user) view returns (bool)",
  "function choice(uint256 id, address user) view returns (bool)",
  "function createSignal(bytes32 metaHash, uint32 duration, uint96 stakeAmount)",
  "function participate(uint256 id, bool isUp) payable",
  "function resolve(uint256 id, bool outcome)",
  "function claim(uint256 id)",
  "event SignalCreated(uint256 indexed id, address indexed creator, bytes32 metaHash, uint32 endTime, uint96 stake)",
  "event SignalAction(uint256 indexed id, address indexed user, bool direction)",
  "event SignalResolved(uint256 indexed id, bool outcome)",
]);

export type SignalItem = {
  id: number;
  creator: `0x${string}`;
  stakeAmount: bigint;
  endTime: number;
  upCount: number;
  downCount: number;
  resolved: boolean;
  outcome: boolean;
};

export type SignalRaw = readonly [
  `0x${string}`,
  bigint,
  bigint | number,
  bigint | number,
  bigint | number,
  boolean,
  boolean,
];

export function mapSignal(
  id: number,
  raw: SignalRaw,
): SignalItem {
  return {
    id,
    creator: raw[0],
    stakeAmount: raw[1],
    endTime: Number(raw[2]),
    upCount: Number(raw[3]),
    downCount: Number(raw[4]),
    resolved: raw[5],
    outcome: raw[6],
  };
}
