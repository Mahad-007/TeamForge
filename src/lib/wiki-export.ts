import type { Json } from "@/types/database";

interface Block {
  type: string;
  content?: InlineContent[];
  props?: Record<string, unknown>;
  children?: Block[];
}

interface InlineContent {
  type: string;
  text?: string;
  styles?: Record<string, boolean>;
}

function inlineToMarkdown(content?: InlineContent[]): string {
  if (!content) return "";
  return content
    .map((item) => {
      if (!item.text) return "";
      let text = item.text;
      if (item.styles?.bold) text = `**${text}**`;
      if (item.styles?.italic) text = `*${text}*`;
      if (item.styles?.code) text = `\`${text}\``;
      if (item.styles?.strikethrough) text = `~~${text}~~`;
      return text;
    })
    .join("");
}

function blockToMarkdown(block: Block, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  const text = inlineToMarkdown(block.content);

  switch (block.type) {
    case "heading": {
      const level = (block.props?.level as number) ?? 1;
      return `${"#".repeat(level)} ${text}\n`;
    }
    case "paragraph":
      return `${text}\n`;
    case "bulletListItem":
      return `${indent}- ${text}\n`;
    case "numberedListItem":
      return `${indent}1. ${text}\n`;
    case "checkListItem": {
      const checked = block.props?.checked ? "x" : " ";
      return `${indent}- [${checked}] ${text}\n`;
    }
    case "codeBlock": {
      const lang = (block.props?.language as string) ?? "";
      return `\`\`\`${lang}\n${text}\n\`\`\`\n`;
    }
    case "quote":
      return `> ${text}\n`;
    case "image": {
      const url = block.props?.url as string;
      const caption = block.props?.caption as string;
      return `![${caption ?? ""}](${url ?? ""})\n`;
    }
    case "table":
      return `[Table]\n`;
    default:
      return text ? `${text}\n` : "";
  }
}

export function exportAsMarkdown(
  title: string,
  content: Json
): string {
  const blocks = (content ?? []) as unknown as Block[];
  let md = `# ${title}\n\n`;

  for (const block of blocks) {
    md += blockToMarkdown(block);
    if (block.children) {
      for (const child of block.children) {
        md += blockToMarkdown(child, 1);
      }
    }
    md += "\n";
  }

  return md.trim();
}
