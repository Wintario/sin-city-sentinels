import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface ImageResizeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageResize: {
      setImageResize: (options: { src: string; alt?: string; title?: string; width?: string }) => ReturnType;
    };
  }
}

export const ImageResize = Node.create<ImageResizeOptions>({
  name: 'imageResize',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => ({
          src: attributes.src,
        }),
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => ({
          alt: attributes.alt,
        }),
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => ({
          title: attributes.title,
        }),
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => ({
          style: attributes.style,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setImageResize:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey('imageResize'),
        props: {
          decorations(state) {
            const { doc, selection } = state;
            const decorations: Decoration[] = [];
            const { from, to } = selection;

            doc.nodesBetween(from, to, (node, pos) => {
              if (node.type.name === 'imageResize') {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'ProseMirror-selectednode',
                    style: 'outline: 2px solid hsl(var(--primary)); position: relative;',
                  })
                );

                // Add resize handles
                const handleStyle = {
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  background: 'hsl(var(--primary))',
                  border: '2px solid white',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                };

                // Bottom-right handle for resize
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    'data-resize-handle': 'true',
                    style: JSON.stringify({
                      ...handleStyle,
                      right: '-5px',
                      bottom: '-5px',
                    }).replace(/[{}"]/g, ''),
                  })
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export default ImageResize;
