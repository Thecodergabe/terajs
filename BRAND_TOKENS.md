# Terajs Brand Tokens

Use this file as the quick reference for the public website, docs, landing pages, and marketing surfaces.

## Palette

```css
:root {
  --tera-black: #0D0D0D;
  --tera-carbon: #1A1A1A;
  --tera-graphite: #2E2E2E;
  --tera-blue: #3A7BFF;
  --tera-cyan: #4FE3FF;
  --tera-purple: #8A5CFF;
  --tera-mist: #B3B3B3;
  --tera-cloud: #F5F5F5;
}
```

## Typography

Primary UI font:

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

Heading font:

```css
font-family: "Space Grotesk", "Inter", sans-serif;
```

Alternate heading option:

```css
font-family: "Satoshi", "Inter", sans-serif;
```

Code font:

```css
font-family: "JetBrains Mono", "Fira Code", monospace;
```

## Usage

- Use `--tera-black` for full-page dark backgrounds.
- Use `--tera-carbon` for cards, panels, and elevated surfaces.
- Use `--tera-graphite` for borders, dividers, and inactive controls.
- Use `--tera-blue` for primary actions.
- Use `--tera-cyan` for hover states and interactive emphasis.
- Use `--tera-purple` for featured accents, highlights, and branded emphasis.
- Use `--tera-mist` for muted text and secondary labels.
- Use `--tera-cloud` for primary text on dark UI.

## Tailwind Reference

The current Tailwind mapping lives in `packages/devtools/tailwind.config.js` under `theme.extend.colors.tera` and `theme.extend.fontFamily`.