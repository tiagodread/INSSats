import type { Action, Condition, ContractBlueprint, Rule } from "./types";

interface RuleRenderContext {
  functionName: string;
  parameters: RuleParameter[];
  body: string[];
}

interface RuleParameter {
  name: string;
  type: string;
  witnessId: string;
  comment?: string;
}

interface HelperUsage {
  signatureHelper: boolean;
  sha256Helper: boolean;
}

interface ConditionRenderResult {
  lines: string[];
  parameters: RuleParameter[];
}

export function blueprintToSimplicity(blueprint: ContractBlueprint): string {
  const helpers: HelperUsage = { signatureHelper: false, sha256Helper: false };
  const ruleContexts = blueprint.rules.map((rule, index) =>
    renderRule(rule, index, helpers)
  );

  const lines: string[] = [];
  lines.push("/*");
  lines.push(` * ${blueprint.metadata.name}`);
  lines.push(` * Network: ${blueprint.metadata.network}`);
  lines.push(` * Version: ${blueprint.metadata.version}`);
  if (blueprint.metadata.description) {
    lines.push(" *");
    wrapComment(blueprint.metadata.description).forEach((line) =>
      lines.push(` * ${line}`)
    );
  }
  if (blueprint.metadata.author) {
    lines.push(` * Author: ${blueprint.metadata.author}`);
  }
  lines.push(` * Generated at: ${blueprint.metadata.createdAt}`);
  lines.push(" */");
  lines.push("");

  if (helpers.signatureHelper) {
    lines.push(...renderSignatureHelper());
    lines.push("");
  }

  if (helpers.sha256Helper) {
    lines.push(...renderSha256Helper());
    lines.push("");
  }

  ruleContexts.forEach((context, index) => {
    if (index > 0) {
      lines.push("");
    }
    const signature =
      context.parameters.length > 0
        ? `fn ${context.functionName}(${context.parameters
            .map((param) => `${param.name}: ${param.type}`)
            .join(", ")}) {`
        : `fn ${context.functionName}() {`;
    lines.push(signature);
    if (context.parameters.length > 0) {
      context.parameters.forEach((param) => {
        if (param.comment) {
          lines.push(`    // ${param.comment}`);
        }
      });
    }
    context.body.forEach((line) => lines.push(`    ${line}`));
    lines.push("}");
  });

  lines.push("");
  lines.push("fn main() {");
  if (!ruleContexts.length) {
    lines.push("    // No rules configured. Add a rule to generate logic.");
  } else {
    const primaryRule = ruleContexts[0];
    if (ruleContexts.length > 1) {
      lines.push(
        "    // TODO: Select which rule to execute at runtime. By default the first rule runs."
      );
      lines.push(
        `    // Available rule entry points: ${ruleContexts
          .map((ctx) => ctx.functionName)
          .join(", ")}`
      );
    }
    primaryRule.parameters.forEach((param) => {
      if (param.comment) {
        lines.push(`    // witness: ${param.comment}`);
      }
      lines.push(`    let ${param.name}: ${param.type} = witness::${param.witnessId};`);
    });
    const invocationArgs = primaryRule.parameters.map((param) => param.name).join(", ");
    const invocation = invocationArgs.length
      ? `${primaryRule.functionName}(${invocationArgs});`
      : `${primaryRule.functionName}();`;
    lines.push(`    ${invocation}`);
  }
  lines.push("}");

  return lines.join("\n");
}

function renderRule(rule: Rule, index: number, helpers: HelperUsage): RuleRenderContext {
  const functionName = makeFunctionName(rule, index);
  const witnessPrefix = makeWitnessPrefix(functionName);
  const body: string[] = [];
  const parameters: RuleParameter[] = [];

  body.push(`// Rule: ${rule.title}`);
  if (rule.purpose) {
    body.push(`// Purpose: ${rule.purpose}`);
  }
  body.push(
    `// Condition mode: ${rule.conditionMode === "all" ? "all conditions must hold" : "any condition may trigger"}`
  );

  if (!rule.conditions.length) {
    body.push("// No conditions defined; this rule always succeeds.");
  } else {
    rule.conditions.forEach((condition, conditionIndex) => {
      const result = renderCondition(
        condition,
        conditionIndex,
        witnessPrefix,
        helpers
      );
      parameters.push(...result.parameters);
      body.push(...result.lines);
    });
  }

  body.push(...renderActionComment(rule.action));

  return { functionName, parameters, body };
}

function renderCondition(
  condition: Condition,
  index: number,
  witnessPrefix: string,
  helpers: HelperUsage
): ConditionRenderResult {
  const lines: string[] = [];
  const parameters: RuleParameter[] = [];
  const label = `Condition ${index + 1}`;

  switch (condition.type) {
    case "after_height": {
      lines.push(`// ${label}: require block height >= ${condition.height}`);
      lines.push(`let min_height_${index}: Height = ${condition.height};`);
      lines.push(`jet::check_lock_height(min_height_${index});`);
      break;
    }
    case "after_timestamp": {
      const timestampSeconds = Math.floor(
        new Date(condition.isoTimestamp).getTime() / 1000
      );
      lines.push(
        `// ${label}: enforce earliest timestamp >= ${condition.isoTimestamp} (unix ${timestampSeconds})`
      );
      lines.push(
        "// TODO: translate this timestamp into an absolute lock (e.g. via nLockTime) suited for your covenant."
      );
      break;
    }
    case "requires_signature": {
      helpers.signatureHelper = true;
      const sigVar = `signature_${index + 1}`;
      const sigId = `${witnessPrefix}_SIGNATURE_${index + 1}`;
      const pkVar = `signer_pk_${index + 1}`;
      const normalizedKey = normalizeHex(condition.key);
      parameters.push({
        name: sigVar,
        type: "Signature",
        witnessId: sigId,
        comment: `Signature witness for ${normalizedKey ?? "unknown pubkey"}`
      });
      lines.push(
        `// ${label}: require signature from pubkey ${normalizedKey ?? condition.key}`
      );
      if (normalizedKey) {
        lines.push(`let ${pkVar}: Pubkey = ${normalizedKey};`);
      } else {
        lines.push(
          `// TODO: replace with a valid 32-byte x-only pubkey for schnorr verification.`
        );
        lines.push(`let ${pkVar}: Pubkey = 0x${"0".repeat(64)};`);
      }
      lines.push(`verify_signature(${pkVar}, ${sigVar});`);
      break;
    }
    case "hash_preimage": {
      const expectedHash = normalizeHex(condition.hash);
      lines.push(
        `// ${label}: require disclosure of a preimage matching ${condition.algorithm.toUpperCase()} hash ${expectedHash ?? condition.hash}`
      );
      if (condition.algorithm === "sha256") {
        helpers.sha256Helper = true;
        const preimageVar = `preimage_${index + 1}`;
        const preimageId = `${witnessPrefix}_PREIMAGE_${index + 1}`;
        const hashVar = `computed_hash_${index + 1}`;
        parameters.push({
          name: preimageVar,
          type: "u256",
          witnessId: preimageId,
          comment: "Preimage for SHA256 verification"
        });
        lines.push(`let ${hashVar}: u256 = hash_sha256(${preimageVar});`);
        if (expectedHash) {
          lines.push(`let expected_hash_${index + 1}: u256 = ${expectedHash};`);
          lines.push(
            `assert!(jet::eq_256(${hashVar}, expected_hash_${index + 1}));`
          );
        } else {
          lines.push(
            "// TODO: replace with a valid 32-byte hash literal (0x...) for comparison."
          );
        }
      } else {
        lines.push(
          `// TODO: add verification for ${condition.algorithm.toUpperCase()} using the appropriate jet helper.`
        );
      }
      break;
    }
    case "oracle_value": {
      lines.push(
        `// ${label}: oracle '${condition.oracleName}' must report value ${condition.comparator} ${condition.expectedValue}`
      );
      lines.push(
        "// TODO: integrate with an oracle adapter or commit-reveal scheme supported by Simplicity."
      );
      break;
    }
    default: {
      lines.push(`// ${label}: unsupported condition type ${condition.type}`);
    }
  }

  return { lines, parameters };
}

function renderActionComment(action: Action): string[] {
  const lines: string[] = [];
  switch (action.type) {
    case "release_to_address":
      lines.push(
        `// Action: release ${action.amount} units of asset ${action.assetId} to address ${action.address}.`
      );
      break;
    case "fan_out_multisig": {
      lines.push(
        `// Action: execute ${action.threshold}-of-${action.participants.length} fan-out multisig.`
      );
      action.participants.forEach((participant, index) => {
        lines.push(
          `//   Participant ${index + 1}: ${participant.label} -> pubkey ${participant.key}`
        );
      });
      break;
    }
    case "abort_contract":
      lines.push(
        `// Action: abort contract${action.reason ? ` – ${action.reason}` : ""}.`
      );
      break;
    case "delegate_control":
      lines.push(
        `// Action: delegate control to pubkey ${action.delegateKey}${
          action.memo ? ` (${action.memo})` : "."
        }`
      );
      break;
    default:
      lines.push(`// Action: ${action.type} (implement manually).`);
  }
  return lines;
}

function renderSignatureHelper(): string[] {
  return [
    "fn verify_signature(pk: Pubkey, sig: Signature) {",
    "    let msg: u256 = jet::sig_all_hash();",
    "    jet::bip_0340_verify((pk, msg), sig);",
    "}"
  ];
}

function renderSha256Helper(): string[] {
  return [
    "fn hash_sha256(data: u256) -> u256 {",
    "    let ctx: Ctx8 = jet::sha_256_ctx_8_init();",
    "    let ctx: Ctx8 = jet::sha_256_ctx_8_add_32(ctx, data);",
    "    jet::sha_256_ctx_8_finalize(ctx)",
    "}"
  ];
}

function normalizeHex(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return undefined;
  }

  return `0x${hex.toLowerCase()}`;
}

function makeFunctionName(rule: Rule, index: number): string {
  const base = slugify(rule.title);
  if (base) {
    return `rule_${base}`;
  }
  return `rule_${index + 1}`;
}

function makeWitnessPrefix(functionName: string): string {
  return functionName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/__+/g, "_")
    .toUpperCase();
}

function slugify(value: string | undefined): string {
  if (!value) {
    return "";
  }
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
  return slug;
}

function wrapComment(text: string, width = 70): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!current.length) {
      current = word;
    } else if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current.length) {
    lines.push(current);
  }

  return lines;
}
