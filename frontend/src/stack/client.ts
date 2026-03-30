import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

export const stackClientApp = new StackClientApp({
  tokenStore: "cookie",
  projectId: "9871a0fe-7d22-442f-af21-d23add255a8a",
  publishableClientKey: "pck_g6adaw7yjd91v6z2v24b98w6k6mz81cbe5jnzw65ejyf0",
  redirectMethod: {
    useNavigate,
  },
});
