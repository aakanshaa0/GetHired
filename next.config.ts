import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from regenerating AGENTS.md/CLAUDE.md on every run.
  agentRules: false,
};

export default nextConfig;
