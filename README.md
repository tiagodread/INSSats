# Liquid Contract Builder

Interactive React + Tailwind application for composing programmable Liquid Network contracts through a guided rule builder interface. Each rule is compiled into a Simplicity blueprint so you can iterate on policy design without writing low-level code.

## Features

- Visual editor for contract metadata and governance context.
- Rule-based composer with configurable condition bundles (timelocks, signatures, hash locks, oracle values).
- Action palette spanning direct transfers, multisig fan-outs, delegation, and safe abort flows.
- Live Simplicity blueprint preview that mirrors the current rule graph.
- Sample blueprint seed to demonstrate common Liquid treasury controls.

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` by default. Update rules, metadata, and actions to see the generated Simplicity refresh in real time.

## Project Structure

- `src/App.tsx` – Layout, state wiring, and top-level composition.
- `src/hooks/useContractBuilder.ts` – Blueprint state management plus Simplicity generation bindings.
- `src/lib` – Domain types, factories, and the Simplicity string generator.
- `src/components` – Form controls for metadata, conditions, actions, and the preview pane.
- `src/data/sampleBlueprint.ts` – Example contract bootstrapped on load.

## Simplicity Output

- The preview emits [SimplicityHL](https://github.com/BlockstreamResearch/SimplicityHL) source that compiles in the official IDE.
- Timelock and signature conditions expand into concrete `jet::check_lock_height` and `jet::bip_0340_verify` statements.
- Required witness values follow the pattern `witness::RULE_NAME_<DATA>`; provide matching entries in a `.wit` file when testing in the IDE.
- Hash preimage checks currently target SHA256 and reuse the helper defined near the top of the generated file. Other hash families and oracle hooks include TODO comments to guide manual completion.
- `fn main()` defaults to calling the first rule; edit the stub or add a rule selector to branch across multiple spend paths.

## Tailwind Utilities

Tailwind is configured via `tailwind.config.ts`. Global directives live in `src/styles.css`. Run `npm run dev` to enable Vite's fast refresh and Tailwind's JIT pipeline.

## Next Steps

- Attach persistence (local storage or remote API) to save and load custom blueprints.
- Add validation helpers for Liquid address formats and public keys.
- Extend the Simplicity assembler with more advanced combinators (branching, scripts, covenants).
