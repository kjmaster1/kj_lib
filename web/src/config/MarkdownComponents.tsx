import {
  Anchor,
  Blockquote,
  Code,
  Divider,
  Image,
  List,
  Text,
  Title,
  createStyles,
} from '@mantine/core';
import { Components } from 'react-markdown';

// Optional: Local styles for specific tweaks
const useStyles = createStyles((theme) => ({
  codeBlock: {
    backgroundColor: theme.colors.dark[6],
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    fontFamily: theme.fontFamilyMonospace,
  },
}));

const MarkdownComponents: Components = {
  // --- Headers ---
  h1: ({ node, ...props }) => <Title order={1} mb="md" {...props} />,
  h2: ({ node, ...props }) => <Title order={2} mt="lg" mb="sm" {...props} />,
  h3: ({ node, ...props }) => <Title order={3} mt="md" mb="sm" {...props} />,
  h4: ({ node, ...props }) => <Title order={4} mt="sm" mb="xs" {...props} />,
  h5: ({ node, ...props }) => <Title order={5} mt="sm" mb="xs" {...props} />,
  h6: ({ node, ...props }) => <Title order={6} mt="sm" mb="xs" {...props} />,

  // --- Body Text ---
  p: ({ node, ...props }) => <Text size="sm" mb="sm" lh={1.6} {...props} />,

  // --- Links ---
  a: ({ node, href, ...props }) => (
    <Anchor href={href} target="_blank" rel="noopener noreferrer" {...props} />
  ),

  // --- Code ---
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return <Code {...props}>{children}</Code>;
    }
    return (
      <Code block color="blue" mb="sm" {...props}>
        {children}
      </Code>
    );
  },

  // --- Lists ---
  // Fix TS2339 & TS2322:
  // We use 'as any' to destruct 'type' and 'ordered' safely.
  // This bypasses the TS check that says 'type' doesn't exist on 'ul' props,
  // while still ensuring it is stripped at runtime so it doesn't break Mantine.
  ul: ({ node, ...props }) => {
    const { type, ordered, ...rest } = props as any;
    return <List type="unordered" withPadding mb="sm" {...rest} />;
  },
  ol: ({ node, ...props }) => {
    const { type, ordered, ...rest } = props as any;
    return <List type="ordered" withPadding mb="sm" {...rest} />;
  },
  li: ({ node, ...props }) => {
    const { checked, index, ordered, ...rest } = props as any;
    return <List.Item {...rest} />;
  },

  // --- Misc Elements ---
  blockquote: ({ node, ...props }) => (
    <Blockquote color="blue" mt="md" mb="md" {...props} />
  ),
  hr: ({ node, ...props }) => <Divider my="md" {...props} />,
  img: ({ node, src, alt, ...props }) => (
    <Image src={src} alt={alt} radius="md" mb="md" {...props} />
  ),
};

export default MarkdownComponents;
