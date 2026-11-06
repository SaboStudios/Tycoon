export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={
        {
          // System stacks — avoid next/font Google fetch at build time.
          ["--font-syne" as string]: "system-ui, -apple-system, Segoe UI, sans-serif",
          ["--font-jetbrains-mono" as string]: "ui-monospace, SFMono-Regular, Menlo, monospace",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
