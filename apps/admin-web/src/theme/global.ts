// Dummy globals for Seed + Linear
import { colors, radius, spacing } from '@novyx/ui';

export const GlobalStyles = `
  :root {
    --snowWhite: ${colors.snowWhite};
    --warmStone: ${colors.warmStone};
    --forestDepths: ${colors.forestDepths};
    --limePulse: ${colors.limePulse};
    --hairlineBorder: ${colors.hairlineBorder};
    --ink: ${colors.ink};
    --pewter: ${colors.pewter};
    --danger: ${colors.danger};
    --primarySoft: ${colors.primarySoft};
    
    --radius-control: ${radius.control}px;
    --radius-card: ${radius.card}px;
  }
  
  body {
    background-color: var(--warmStone);
    color: var(--ink);
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  * { box-sizing: border-box; }
`;
