import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { Box } from '@mui/material';

export default function Markdown({ children }: { children: string }) {
  return (
    <Box className="markdown-body" sx={{ '& > *:first-of-type': { mt: 0 } }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
}
