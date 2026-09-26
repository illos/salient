import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

// Source references become ordinary English labels, not unusable SCC links.
function readableLinks() {
  return tree => {
    function walk(node) {
      if (!node.children) return;
      node.children = node.children.flatMap(child => {
        walk(child);
        return child.tagName === 'a' ? child.children : [child];
      });
    }
    walk(tree);
  };
}
const processor = unified().use(remarkParse).use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw)
  .use(rehypeSanitize).use(readableLinks).use(rehypeStringify);
let input = '';
for await (const chunk of process.stdin) input += chunk;
const texts = JSON.parse(input);
process.stdout.write(JSON.stringify(texts.map(text => String(processor.processSync(text)))));
