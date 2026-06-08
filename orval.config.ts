import { defineConfig } from "orval";

export default defineConfig({
  member: {
    input: {
      target: "../GoodsMall_BE/docs/api/openapi/member.json",
      unsafeDisableValidation: true,
    },
    output: {
      mode: "split",
      target: "src/api/generated/member/member.ts",
      schemas: "src/api/generated/member/model",
      client: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "src/api/openapiMutator.ts",
          name: "openapiMutator",
        },
      },
    },
  },
  product: {
    input: {
      target: "../GoodsMall_BE/docs/api/openapi/product.json",
      unsafeDisableValidation: true,
    },
    output: {
      mode: "split",
      target: "src/api/generated/product/product.ts",
      schemas: "src/api/generated/product/model",
      client: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "src/api/openapiMutator.ts",
          name: "openapiMutator",
        },
      },
    },
  },
});
