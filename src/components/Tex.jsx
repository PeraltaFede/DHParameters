import katex from 'katex';
import { useMemo } from 'react';

/** KaTeX renderer. Pass TeX as a string child: <Tex>{String.raw`\theta_j`}</Tex> */
export function Tex({ children, block = false, className = '' }) {
  const src = Array.isArray(children) ? children.join('') : String(children ?? '');
  const html = useMemo(
    () => katex.renderToString(src, { throwOnError: false, displayMode: block, strict: 'ignore' }),
    [src, block],
  );
  const Tag = block ? 'div' : 'span';
  return (
    <Tag className={`tex${block ? ' tex-block' : ''} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Inline math shorthand. */
export const M = ({ children }) => <Tex>{children}</Tex>;
